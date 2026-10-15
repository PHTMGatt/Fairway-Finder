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
    if (import.meta.env.VITE_PREVIEW_MODE === 'true') {
      setErrorMessage('Account creation is unavailable in this review preview.');
      return;
    }
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
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-header">Sign Up</h1>
        <div className="auth-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              name="name"
              aria-label="Name"
              autoComplete="name"
              required
              className="auth-input"
              placeholder="Username"
              value={formValues.name}
              onChange={handleChange}
            />
            <input
              name="email"
              aria-label="Email"
              autoComplete="email"
              required
              type="email"
              className="auth-input"
              placeholder="Email"
              value={formValues.email}
              onChange={handleChange}
            />
            <input
              name="password"
              aria-label="Password"
              autoComplete="new-password"
              minLength={8}
              required
              type="password"
              className="auth-input"
              placeholder="Password"
              value={formValues.password}
              onChange={handleChange}
            />
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Submit'}
            </button>
          </form>
          {errorMessage && (
            <div className="auth-error">{errorMessage}</div>
          )}

        </div>
      </div>
    </section>
  );
};

export default Signup;
