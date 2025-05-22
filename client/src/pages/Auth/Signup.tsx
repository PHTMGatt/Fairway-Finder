import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../../utils/auth';
import { ADD_PROFILE } from '../../utils/mutations';
import './Auth.css';

const Signup: React.FC = () => {
  // Note; Form state for new user
  const [formState, setFormState] = useState({ name: '', email: '', password: '' });

  // Note; GraphQL mutation for profile creation
  const [addProfile, { data, error }] = useMutation(ADD_PROFILE);

  // Note; Input change handler
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Note; Submit form handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await addProfile({
        variables: { input: { ...formState } },
      });
      Auth.login(response.data.addProfile.token); // Note; Login immediately on signup
    } catch (err) {
      console.error(err);
    }
  };

  // Note; Redirect if already logged in
  if (Auth.loggedIn()) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Sign Up</h4>
        <div className="auth-body">
          {data ? (
            // Note; Success message after signup
            <p>
              Success! Go <Link to="/dashboard">to your trips.</Link>
            </p>
          ) : (
            // Note; Signup form UI
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
          {/* Note; Show GraphQL error if any */}
          {error && <div className="auth-error">{error.message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Signup;
