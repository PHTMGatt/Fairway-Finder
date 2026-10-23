import { useApolloClient } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { MouseEvent, useEffect, useState } from 'react';
import { useAuth } from '../../pages/Auth/AuthContext';
import Auth, { SessionInfo } from '../../utils/auth';
import golfGif from '../../assets/images/golf2.gif';
import './Header.css';

interface GuestBannerState {
  expiresAt: Date;
  warning: boolean;
  expired: boolean;
}

export const getGuestBannerState = (
  session: SessionInfo | null,
  now: number = Date.now()
): GuestBannerState | null => {
  if (!session?.isGuest || !session.expiresAt) return null;
  const remaining = session.expiresAt.getTime() - now;
  return {
    expiresAt: session.expiresAt,
    warning: remaining <= 2 * 60 * 60 * 1000,
    expired: remaining <= 0,
  };
};

const Header: React.FC = () => {
  const { isLoggedIn, logoutUser } = useAuth();
  const apolloClient = useApolloClient();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const guestBanner = getGuestBannerState(Auth.getSessionInfo(), now);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!guestBanner?.expired) return;
    logoutUser();
    void apolloClient.clearStore().finally(() => {
      navigate('/login?reason=guest_expired', { replace: true });
    });
  }, [apolloClient, guestBanner?.expired, logoutUser, navigate]);

  const handleLogout = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    logoutUser();
    void apolloClient.clearStore().finally(() => {
      navigate('/', { replace: true });
    });
  };

  return (
    <header className="header header--bg">
      <Link to="/" className="header__icon-link">
        <img src={golfGif} alt="Home" className="header__gif-icon" />
      </Link>

      <Link to="/" className="header__logo">
        FAIRWAY FINDER
      </Link>

      <div className="header__spacer" />

      <div className="header__actions">
        {isLoggedIn ? (
          <>
            <Link to="/saved-trips" className="header__btn">
              My Trips
            </Link>
            <button onClick={handleLogout} className="header__btn">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="header__btn">
              Log In
            </Link>
            <Link to="/signup" className="header__btn">
              Sign Up
            </Link>
          </>
        )}
      </div>

      {guestBanner && !guestBanner.expired && (
        <div
          className={`header__guest-banner${guestBanner.warning ? ' header__guest-banner--warning' : ''}`}
          role="status"
        >
          <span>
            Guest Demo · temporary data deletes at{' '}
            {guestBanner.expiresAt.toLocaleString([], {
              hour: 'numeric',
              minute: '2-digit',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {guestBanner.warning && <strong>Less than 2 hours left</strong>}
        </div>
      )}
    </header>
  );
};

export default Header;
