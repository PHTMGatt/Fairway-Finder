import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import Auth from '../utils/auth';
import { START_GUEST_SESSION } from '../utils/mutations';
import { useAuth } from '../pages/Auth/AuthContext';
import { extractGuestToken, GUEST_DEMO_NOTE } from './GuestDemoButton.utils';
import './GuestDemoButton.css';

interface StartGuestSessionData {
  startGuestSession?: {
    token?: string | null;
  } | null;
}

interface GuestDemoButtonProps {
  className?: string;
}

const GuestDemoButton: React.FC<GuestDemoButtonProps> = ({ className = '' }) => {
  const [startGuestSession, { loading }] = useMutation<StartGuestSessionData>(START_GUEST_SESSION);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  const handleStartGuest = async () => {
    setErrorMessage(null);
    try {
      const { data } = await startGuestSession();
      const token = extractGuestToken(data);
      if (!token) throw new Error('Guest Demo did not return a session token.');

      Auth.login(token);
      refreshAuth();
      navigate('/plan-trip', { replace: true });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Could not start Guest Demo. Please try again.'
      );
    }
  };

  return (
    <div className="guest-demo">
      <button
        type="button"
        className={`guest-demo__button ${className}`.trim()}
        onClick={handleStartGuest}
        disabled={loading}
      >
        {loading ? 'Starting Guest Demo…' : 'Try as Guest'}
      </button>
      <p className="guest-demo__note">{GUEST_DEMO_NOTE}</p>
      {errorMessage && (
        <p className="guest-demo__error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GuestDemoButton;
