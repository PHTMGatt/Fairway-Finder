// src/pages/Auth/'Signup.tsx'

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Auth from '../../utils/auth';
import { ADD_PROFILE } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import './Signup.css';

const Signup: React.FC = () => {
  // Note; Track name/email/password and potential error
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Note; Apollo mutation for creating a new profile
  const [addProfile, { loading }] = useMutation(ADD_PROFILE);

  // Note; Refresh auth context after signup
  const { refreshAuth } = useAuth();

  // Note; Handle changes in any of the input fields
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  // Note; Submit the signup mutation
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { name, email, password } = formValues;
    if (!name || !email || !password) {
      setErrorMessage('All fields are required.');
      return;
    }

    try {
      const { data } = await addProfile({
        variables: { input: formValues },
      });
      const token = data?.addProfile?.token;
      if (token) {
        Auth.login(token);   // Note; Save token to localStorage
        refreshAuth();       // Note; Update context to logged-in
      } else {
        setErrorMessage('Signup failed.');
      }
    } catch (err: any) {
      const message =
        err?.graphQLErrors?.[0]?.message || err.message || 'Signup failed.';
      setErrorMessage(message);
    }
  };

  // Note; Redirect if already authenticated
  if (Auth.loggedIn()) {
    return <Navigate to="/saved-trips" replace />;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Sign Up</h4>
        <div className="auth-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              name="name"
              className="auth-input"
              placeholder="Username"
              value={formValues.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              className="auth-input"
              placeholder="Email"
              value={formValues.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              className="auth-input"
              placeholder="Password"
              value={formValues.password}
              onChange={handleChange}
            />
            <button
              type="submit"
              className="btn auth-btn"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Submit'}
            </button>
          </form>
          {errorMessage && (
            <div className="auth-error">{errorMessage}</div>
          )}

          {/* Note; Dev-only: clear all user profiles */}
          <button
            className="btn auth-btn clear-session-btn"
            onClick={async () => {
              await fetch('/api/dev/clear-users', { method: 'DELETE' });
              Auth.logout();
              window.location.reload();
            }}
          >
            Delete All Users (DEV ONLY)
          </button>
        </div>
      </div>
    </main>
);
}

export default Signup;
