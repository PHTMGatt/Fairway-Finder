// src/pages/Auth/Signup.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../../utils/auth';
import { ADD_PROFILE } from '../../utils/mutations';
import { useAuth } from './AuthContext'; // Note; Access auth context to trigger refresh
import './Auth.css';

const Signup: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', password: '' });
  const [signupError, setSignupError] = useState<string | null>(null);
  const [addProfile, { loading }] = useMutation(ADD_PROFILE);
  const { refresh } = useAuth(); // Note; Refresh context after signup

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const { name, email, password } = formState;
    if (!name || !email || !password) {
      setSignupError('All fields are required.');
      return;
    }

    try {
      const res = await addProfile({ variables: { input: formState } });
      if (res.data?.addProfile?.token) {
        Auth.login(res.data.addProfile.token); // Note; Save token to localStorage
        refresh(); // Note; Update context to reflect logged-in state
      } else {
        setSignupError('Signup failed.');
      }
    } catch (err: any) {
      const gqlMessage = err?.graphQLErrors?.[0]?.message || err.message;
      setSignupError(gqlMessage);
    }
  };

  // Note; Redirect if already logged in
  if (Auth.loggedIn()) return <Navigate to="/me" replace />;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Sign Up</h4>
        <div className="auth-body">
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              className="auth-input"
              name="name"
              placeholder="Username"
              value={formState.name}
              onChange={handleChange}
            />
            <input
              className="auth-input"
              name="email"
              placeholder="Email"
              value={formState.email}
              onChange={handleChange}
            />
            <input
              className="auth-input"
              name="password"
              placeholder="Password"
              type="password"
              value={formState.password}
              onChange={handleChange}
            />
            <button className="btn auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </form>
          {signupError && <div className="auth-error">{signupError}</div>}

          {/* Note; Dev Nuke Button – delete all profiles */}
          <button
            className="btn auth-btn clear-session-btn"
            onClick={async () => {
              await fetch('http://localhost:3001/api/dev/clear-users', { method: 'DELETE' });
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
};

export default Signup;
