// src/pages/Auth/Login.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../../utils/auth';
import { LOGIN_USER } from '../../utils/mutations';
import { useAuth } from './AuthContext'; // Note; Access auth context to trigger refresh
import './Auth.css';

const Login: React.FC = () => {
  // Note; Form state for email and password
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const [loginMutation, { loading }] = useMutation(LOGIN_USER);
  const { refresh } = useAuth(); // Note; Needed to trigger isLoggedIn update after login

  // Note; Input change handler
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
  };

  // Note; Form submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!formState.email || !formState.password) {
      setLoginError('Email and password are required.');
      return;
    }
    try {
      const res = await loginMutation({ variables: formState });
      if (res.data?.login?.token) {
        Auth.login(res.data.login.token); // Note; Stores token in localStorage
        refresh(); // Note; Update context so Header sees logged-in state
      } else {
        setLoginError('Invalid login.');
      }
    } catch (err: any) {
      const gqlMessage = err?.graphQLErrors?.[0]?.message || err.message;
      setLoginError(gqlMessage);
    }
  };

  // Note; Redirect if already logged in
  if (Auth.loggedIn()) return <Navigate to="/me" replace />;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Log In</h4>
        <div className="auth-body">
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              className="auth-input"
              name="email"
              placeholder="Email"
              type="email"
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
              {loading ? 'Logging in…' : 'Submit'}
            </button>
          </form>
          {loginError && <div className="auth-error">{loginError}</div>}
        </div>
      </div>
    </main>
  );
};

export default Login;
