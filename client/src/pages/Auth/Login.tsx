import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Auth from '../../utils/auth';
import { LOGIN_USER } from '../../utils/mutations';
import GuestDemoButton from '../../components/GuestDemoButton';
import { useAuth } from './AuthContext';
import { getLoginReasonMessage } from './loginReason';
import './Auth.css';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const [loginUser, { loading }] = useMutation(LOGIN_USER);
  const { refreshAuth } = useAuth();
  const reasonMessage = getLoginReasonMessage(searchParams.get('reason'));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

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
        Auth.login(token);
        refreshAuth();
      } else {
        setErrorMessage('Invalid credentials.');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message ? error.message : 'Login failed.';
      setErrorMessage(message);
    }
  };

  if (Auth.loggedIn()) {
    const destination = Auth.getSessionInfo()?.isGuest ? '/plan-trip' : '/saved-trips';
    return <Navigate to={destination} replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title" className="auth-header">Log In</h1>
        <div className="auth-body">
          {reasonMessage && (
            <div className="auth-info" role="status">
              {reasonMessage}
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              name="email"
              type="email"
              className="auth-input"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={credentials.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              className="auth-input"
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
          {errorMessage && (
            <div className="auth-error" role="alert">{errorMessage}</div>
          )}
          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>
          <GuestDemoButton className="auth-btn" />
        </div>
      </section>
    </main>
  );
};

export default Login;
