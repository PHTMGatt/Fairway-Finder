import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../../utils/auth';
import { LOGIN_USER } from '../../utils/mutations';
import './Auth.css';

const Login: React.FC = () => {
  // Note; Form state for email and password
  const [formState, setFormState] = useState({ email: '', password: '' });

  // Note; GraphQL mutation for login
  const [login, { data, error }] = useMutation(LOGIN_USER);

  // Note; Input field change handler
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Note; Form submission handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ variables: { ...formState } });
      Auth.login(response.data.login.token); // Note; Save token and redirect
    } catch (err) {
      console.error(err);
    }
  };

  // Note; Redirect if already logged in
  if (Auth.loggedIn()) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Log In</h4>
        <div className="auth-body">
          {data ? (
            // Note; Success message after login
            <p>
              Success! Go <Link to="/dashboard">to your trips.</Link>
            </p>
          ) : (
            // Note; Login form UI
            <form onSubmit={handleSubmit} className="auth-form">
              <input
                className="auth-input"
                placeholder="Email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
              />
              <input
                className="auth-input"
                placeholder="Password"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
              />
              <button className="btn auth-btn" type="submit">
                Submit
              </button>
            </form>
          )}
          {/* Note; Show error if login fails */}
          {error && <div className="auth-error">{error.message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Login;
