import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../../utils/auth';
import { ADD_PROFILE } from '../../utils/mutations';
import './Auth.css';

const Signup: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', password: '' });
  const [addProfile, { data, error }] = useMutation(ADD_PROFILE);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await addProfile({ variables: { input: { ...formState } } });
      Auth.login(response.data.addProfile.token);
    } catch (err) {
      console.error(err);
    }
  };

  if (Auth.loggedIn()) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Sign Up</h4>
        <div className="auth-body">
          {data ? (
            <p>
              Success! Go <Link to="/dashboard">to your trips.</Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <input
                className="auth-input"
                placeholder="Username"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange}
              />
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
          {error && <div className="auth-error">{error.message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Signup;
