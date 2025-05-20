// client/src/pages/Login.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../utils/auth';
import { LOGIN_USER } from '../utils/mutations';
import './Login.css';

const Login: React.FC = () => {
  const [formState, setFormState] = useState({
    email: '',
    password: ''
  });

  const [login, { data, error }] = useMutation(LOGIN_USER);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({
        variables: { ...formState }
      });
      const token = response.data.login.token;
      Auth.login(token);
    } catch (err) {
      console.error(err);
    }
  };

  if (Auth.loggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="login container">
      <div className="login__card">
        <h4 className="login__header">Log In</h4>
        <div className="login__body">
          {data ? (
            <p>
              Success! Go <Link to="/dashboard">to your trips.</Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="login__form">
              <input
                className="login__input"
                placeholder="Email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
              />
              <input
                className="login__input"
                placeholder="Password"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
              />
              <button className="btn login__btn" type="submit">
                Submit
              </button>
            </form>
          )}
          {error && <div className="login__error">{error.message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Login;
