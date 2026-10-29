import { useApolloClient, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { MouseEvent, useEffect, useState } from 'react';
import { FaFlag } from 'react-icons/fa';
import { useAuth } from '../../pages/Auth/AuthContext';
import Auth from '../../utils/auth';
import { RESET_GUEST_DEMO } from '../../utils/mutations';
import { getGuestBannerState } from './guestBanner';
import { getHeaderNavigation } from './headerNavigation';
import './Header.css';

const Header: React.FC = () => {
  const { isLoggedIn, logoutUser } = useAuth();
  const apolloClient = useApolloClient();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [demoResetError, setDemoResetError] = useState('');
  const [resetGuestDemo, { loading: resettingDemo }] = useMutation(RESET_GUEST_DEMO);
  const guestBanner = getGuestBannerState(Auth.getSessionInfo(), now);
  const navigation = getHeaderNavigation(isLoggedIn);

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

  const handleResetDemo = async () => {
    setDemoResetError('');
    try {
      await resetGuestDemo();
      await apolloClient.resetStore();
      navigate('/saved-trips', { replace: true });
    } catch (error: unknown) {
      setDemoResetError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not reset the demo. Please try again.'
      );
    }
  };

  return (
    <header className="header header--bg">
      <div className="header__main">
        <Link to="/" className="header__brand" aria-label="Fairway Finder home">
          <span className="header__home-icon" aria-hidden="true">
            <FaFlag />
          </span>
          <span className="header__logo">FAIRWAY FINDER</span>
        </Link>

        <nav className="header__actions" aria-label="Primary navigation">
          {navigation.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`header__btn${isLoggedIn && index === 0 ? ' header__btn--primary' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {isLoggedIn && (
            <button onClick={handleLogout} className="header__btn header__btn--quiet">
              Log Out
            </button>
          )}
        </nav>
      </div>

      {guestBanner && !guestBanner.expired && (
        <div
          className={`header__guest-banner${guestBanner.warning ? ' header__guest-banner--warning' : ''}`}
          role="status"
        >
          <div className="header__guest-copy">
            <strong className="header__demo-badge">Demo Mode</strong>
            <span>
              Isolated sample data · resets automatically at{' '}
              {guestBanner.expiresAt.toLocaleString([], {
                hour: 'numeric',
                minute: '2-digit',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {guestBanner.warning && <strong>Less than 2 hours left</strong>}
          </div>
          <button
            type="button"
            className="header__demo-reset"
            onClick={handleResetDemo}
            disabled={resettingDemo}
          >
            {resettingDemo ? 'Resetting…' : 'Reset Demo'}
          </button>
          {demoResetError && (
            <span className="header__demo-error" role="alert">
              {demoResetError}
            </span>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
