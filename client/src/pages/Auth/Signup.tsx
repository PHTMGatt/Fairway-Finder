import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Auth from '../../utils/auth';
import { ADD_PROFILE } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import './Signup.css';

// Note; Mirrors the server rule for new passwords
const PASSWORD_MIN_LENGTH = 8;

const Signup: React.FC = () => {
  // Note; Invite links look like /signup?invite=CODE, so prefill the code from the URL
  const [searchParams] = useSearchParams();

  // Note; Track name/email/password/invite code and potential error
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    inviteCode: searchParams.get('invite')?.trim() ?? '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Note; Apollo mutation for creating a new profile
  const [addProfile, { loading }] = useMutation(ADD_PROFILE);

  // Note; Refresh auth context after signup
  const { refreshAuth } = useAuth();

  // Note; Handle changes in any of the input fields
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  // Note; Submit the signup mutation
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { name, email, password, inviteCode } = formValues;
    if (!name || !email || !password || !inviteCode.trim()) {
      setErrorMessage('All fields are required.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setErrorMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    try {
      const { data } = await addProfile({
        variables: { input: { ...formValues, inviteCode: inviteCode.trim() } },
      });
      const token = data?.addProfile?.token;
      if (token) {
        Auth.login(token);   // Note; Save token to localStorage
        refreshAuth();       // Note; Update context to logged-in
      } else {
        setErrorMessage('Signup failed.');
      }
    } catch (err: any) {
      const message =
        err?.graphQLErrors?.[0]?.message || err.message || 'Signup failed.';
      setErrorMessage(message);
    }
  };

  // Note; Redirect if already authenticated
  if (Auth.loggedIn()) {
    return <Navigate to="/saved-trips" replace />;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Sign Up</h4>
        <div className="auth-body">
          <p className="auth-note">
            Fairway Finder accounts are invite-only. Enter the code from your invite.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              name="inviteCode"
              className="auth-input"
              placeholder="Invite code"
              aria-label="Invite code"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={formValues.inviteCode}
              onChange={handleChange}
            />
            <input
              name="name"
              className="auth-input"
              placeholder="Username"
              aria-label="Username"
              autoComplete="username"
              autoCapitalize="none"
              value={formValues.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              className="auth-input"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={formValues.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              className="auth-input"
              placeholder={`Password (${PASSWORD_MIN_LENGTH}+ characters)`}
              aria-label="Password"
              autoComplete="new-password"
              value={formValues.password}
              onChange={handleChange}
            />
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>
          {errorMessage && (
            <div className="auth-error" role="alert">{errorMessage}</div>
          )}
          <p className="auth-note">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Signup;
