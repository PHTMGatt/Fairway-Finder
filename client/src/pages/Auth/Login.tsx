import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Auth from '../../utils/auth';
import { LOGIN_USER } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import { getLoginReasonMessage } from './loginReason';
import './Login.css';

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
    return <Navigate to="/saved-trips" replace />;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Log In</h4>
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
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
          {errorMessage && <div className="auth-error" role="alert">{errorMessage}</div>}
          <p className="auth-note auth-note--row">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/signup">Create account</Link>
          </p>
          <div className="auth-divider" aria-hidden="true">
            <span>or skip the account</span>
          </div>
          <div className="auth-demo-callout">
            <div>
              <strong>Play as a guest</strong>
              <span>Private to this phone for 24 hours. No email or password.</span>
            </div>
            <Link to="/courses" className="auth-btn auth-btn--guest">
              Start a round
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
