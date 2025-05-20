// client/src/pages/Signup.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';

import Auth from '../utils/auth';
import { ADD_PROFILE } from '../utils/mutations';
import './Signup.css';

const Signup: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [addProfile, { data, error }] = useMutation(ADD_PROFILE);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await addProfile({
        variables: { input: { ...formState } }
      });
      const token = response.data.addProfile.token;
      Auth.login(token);
    } catch (err) {
      console.error(err);
    }
  };

  // If already logged in, send them to their dashboard
  if (Auth.loggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="signup container">
      <div className="signup__card">
        <h4 className="signup__header">Sign Up</h4>
        <div className="signup__body">
          {data ? (
            <p>
              Success! Go <Link to="/dashboard">to your trips.</Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="signup__form">
              <input
                className="signup__input"
                placeholder="Username"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange}
              />
              <input
                className="signup__input"
                placeholder="Email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
              />
              <input
                className="signup__input"
                placeholder="Password"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleChange}
              />
              <button className="btn signup__btn" type="submit">
                Submit
              </button>
            </form>
          )}
          {error && <div className="signup__error">{error.message}</div>}
        </div>
      </div>
    </main>
  );
};

export default Signup;
