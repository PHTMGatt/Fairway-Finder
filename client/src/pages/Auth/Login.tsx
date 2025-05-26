// src/pages/Auth/Login.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Auth from '../../utils/auth';
import { LOGIN_USER } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import './Login.css';

const Login: React.FC = () => {
  // Note; Track email/password inputs and any error message
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Note; Apollo mutation for logging in
  const [loginUser, { loading }] = useMutation(LOGIN_USER);

  // Note; Refresh auth context after successful login
  const { refreshAuth } = useAuth();

  // Note; Update form state on each keystroke
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  // Note; Submit the login mutation
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { email, password } = credentials;
    if (!email || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    try {
      const { data } = await loginUser({ variables: { email, password } });
      const token = data?.login?.token;
      if (token) {
        Auth.login(token);     // Note; Save token to localStorage
        refreshAuth();         // Note; Trigger context update
      } else {
        setErrorMessage('Invalid credentials.');
      }
    } catch (err: any) {
      const message =
        err?.graphQLErrors?.[0]?.message || err.message || 'Login failed.';
      setErrorMessage(message);
    }
  };

  // Note; If already authenticated, redirect to saved trips
  if (Auth.loggedIn()) {
    return <Navigate to="/saved-trips" replace />;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Log In</h4>
        <div className="auth-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              name="email"
              type="email"
              className="auth-input"
              placeholder="Email"
              value={credentials.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              className="auth-input"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
            />
            <button
              type="submit"
              className="btn auth-btn"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Submit'}
            </button>
          </form>
          {errorMessage && (
            <div className="auth-error">{errorMessage}</div>
          )}
        </div>
      </div>
    </main>
);
}

export default Login;
