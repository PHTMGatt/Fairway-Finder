// client/src/pages/Auth/ForgotPassword.tsx
// Email → 6-digit code + new password → logged in.
import React, { FormEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import Auth from '../../utils/auth';
import { REQUEST_PASSWORD_RESET, RESET_PASSWORD } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import { cleanCode, errorText } from './authCodeUtils';
import './Signup.css';

const PASSWORD_MIN_LENGTH = 8;

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requestReset, { loading: sending }] = useMutation(REQUEST_PASSWORD_RESET);
  const [resetPassword, { loading: saving }] = useMutation(RESET_PASSWORD);
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter the email you signed up with.');
      return;
    }
    try {
      await requestReset({ variables: { email: email.trim() } });
      setStep('code');
    } catch (err: unknown) {
      setError(errorText(err, 'Could not send the code. Try again.'));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    try {
      const { data } = await resetPassword({ variables: { email: email.trim(), code, password } });
      const token = data?.resetPassword?.token;
      if (!token) throw new Error('Could not reset the password.');
      Auth.login(token);
      refreshAuth();
      navigate('/me', { replace: true });
    } catch (err: unknown) {
      setError(errorText(err, 'Could not reset the password.'));
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h4 className="auth-header">Reset password</h4>
        <div className="auth-body">
          {step === 'email' ? (
            <form className="auth-form" onSubmit={sendCode}>
              <p className="auth-note">We&apos;ll email you a 6-digit code.</p>
              <input
                type="email"
                className="auth-input"
                placeholder="Email"
                aria-label="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="auth-btn" disabled={sending}>
                {sending ? 'Sending…' : 'Email me a code'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              <div className="auth-info" role="status">
                If {email.trim()} has an account, a code is on its way. Check spam too.
              </div>
              <input
                className="auth-input auth-input--code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                aria-label="6-digit code"
                value={code}
                onChange={(e) => setCode(cleanCode(e.target.value))}
                autoFocus
              />
              <input
                type="password"
                className="auth-input"
                placeholder={`New password (${PASSWORD_MIN_LENGTH}+ characters)`}
                aria-label="New password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="auth-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Set new password'}
              </button>
              <p className="auth-note">
                <button type="button" className="auth-link" onClick={() => void sendCode()} disabled={sending}>
                  Send a new code
                </button>
              </p>
            </form>
          )}
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <p className="auth-note">
            Remembered it? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
