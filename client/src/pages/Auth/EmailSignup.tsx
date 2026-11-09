// client/src/pages/Auth/EmailSignup.tsx
// Two simple steps: (1) name, email, password  →  (2) type the 6-digit code from the email.
import React, { FormEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import Auth from '../../utils/auth';
import { REQUEST_SIGNUP_CODE, VERIFY_EMAIL } from '../../utils/mutations';
import { useAuth } from './AuthContext';
import { cleanCode, errorText } from './authCodeUtils';

const PASSWORD_MIN_LENGTH = 8;

const EmailSignup: React.FC = () => {
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestCode, { loading: sending }] = useMutation(REQUEST_SIGNUP_CODE);
  const [verifyEmail, { loading: verifying }] = useMutation(VERIFY_EMAIL);
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Fill in your name, email and a password.');
      return;
    }
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    try {
      await requestCode({ variables: { input: { ...form, name: form.name.trim(), email: form.email.trim() } } });
      setStep('code');
      setNotice(`We emailed a 6-digit code to ${form.email.trim()}. It can take a minute; check spam too.`);
    } catch (err: unknown) {
      setError(errorText(err, 'Could not send the code. Try again.'));
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    try {
      const { data } = await verifyEmail({ variables: { email: form.email.trim(), code } });
      const token = data?.verifyEmail?.token;
      if (!token) throw new Error('Could not verify the code.');
      Auth.login(token);
      refreshAuth();
      navigate('/me', { replace: true });
    } catch (err: unknown) {
      setError(errorText(err, 'Could not verify the code.'));
    }
  };

  if (step === 'code') {
    return (
      <>
        {notice && (
          <div className="auth-info" role="status">
            {notice}
          </div>
        )}
        <form className="auth-form" onSubmit={submitCode}>
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
          <button type="submit" className="auth-btn" disabled={verifying || code.length !== 6}>
            {verifying ? 'Checking…' : 'Finish sign-up'}
          </button>
        </form>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        <p className="auth-note">
          No email?{' '}
          <button type="button" className="auth-link" onClick={() => void sendCode()} disabled={sending}>
            Send a new code
          </button>{' '}
          ·{' '}
          <button type="button" className="auth-link" onClick={() => setStep('details')}>
            Change email
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <form className="auth-form" onSubmit={sendCode}>
        <input
          name="name"
          className="auth-input"
          placeholder="Your name"
          aria-label="Your name"
          autoComplete="username"
          value={form.name}
          maxLength={40}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          name="email"
          type="email"
          className="auth-input"
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          name="password"
          type="password"
          className="auth-input"
          placeholder={`Password (${PASSWORD_MIN_LENGTH}+ characters)`}
          aria-label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <button type="submit" className="auth-btn" disabled={sending}>
          {sending ? 'Sending code…' : 'Email me a code'}
        </button>
      </form>
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
    </>
  );
};

export default EmailSignup;
