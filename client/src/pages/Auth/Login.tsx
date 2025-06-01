import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Auth from '../../utils/auth';
import { LOGIN_USER } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import './Login.css';

//Note; remastered Login page with preserved flow and error handling
const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginUser, { loading }] = useMutation(LOGIN_USER);
  const { refreshAuth } = useAuth();

  //Note; handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  //Note; handle form submit
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
    } catch (err: any) {
      const message =
        err?.graphQLErrors?.[0]?.message || err.message || 'Login failed.';
      setErrorMessage(message);
    }
  };

  //Note; redirect if already logged in
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
              className="auth-btn"
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
};

export default Login;
