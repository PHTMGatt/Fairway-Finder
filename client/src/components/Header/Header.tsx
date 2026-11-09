import { useApolloClient, useMutation } from '@apollo/client';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MouseEvent, useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  FaCalculator,
  FaCloudSun,
  FaFlag,
  FaGolfBall,
  FaHome,
  FaRoute,
  FaSignInAlt,
  FaSignOutAlt,
  FaSuitcase,
  FaUserPlus,
} from 'react-icons/fa';
import { FaMapLocationDot } from 'react-icons/fa6';
import { useAuth } from '../../pages/Auth/AuthContext';
import Auth from '../../utils/auth';
import { RESET_GUEST_DEMO } from '../../utils/mutations';
import { QUERY_MY_TRIPS, QUERY_TRIPS } from '../../utils/queries';
import { getGuestBannerState } from './guestBanner';
import { getHeaderNavigation, isNavActive, NavIcon } from './headerNavigation';
import './Header.css';

const ICONS: Record<NavIcon, IconType> = {
  home: FaHome,
  plan: FaMapLocationDot,
  trips: FaSuitcase,
  courses: FaGolfBall,
  weather: FaCloudSun,
  routes: FaRoute,
  handicap: FaCalculator,
  login: FaSignInAlt,
  signup: FaUserPlus,
};

/**
 * App navigation: a fixed left sidebar on desktop, and a slim top bar plus a
 * bottom tab bar on phones. Same items, same order, so nothing moves around.
 */
const Header: React.FC = () => {
  const { isLoggedIn, logoutUser } = useAuth();
  const apolloClient = useApolloClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [now, setNow] = useState(Date.now());
  const [demoResetError, setDemoResetError] = useState('');
  const [resetGuestDemo, { loading: resettingDemo }] = useMutation(RESET_GUEST_DEMO);
  const guestBanner = getGuestBannerState(Auth.getSessionInfo(), now);
  const navigation = getHeaderNavigation(isLoggedIn);
  const mobileNavigation = navigation.filter((item) => item.mobile);

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
    if (!window.confirm('Start over? This deletes your guest rounds and scores and loads the sample round again.')) return;
    setDemoResetError('');
    try {
      await resetGuestDemo({
        refetchQueries: [QUERY_TRIPS, QUERY_MY_TRIPS],
        awaitRefetchQueries: true,
      });
      navigate('/saved-trips', { replace: true });
    } catch (error: unknown) {
      setDemoResetError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not reset the demo. Please try again.'
      );
    }
  };

  const brand = (
    <Link to={isLoggedIn ? '/me' : '/'} className="nav__brand" aria-label="Fairway Finder home">
      <span className="nav__brand-icon" aria-hidden="true">
        <FaFlag />
      </span>
      <span className="nav__brand-name">Fairway Finder</span>
    </Link>
  );

  const logoutButton = isLoggedIn && (
    <button type="button" onClick={handleLogout} className="nav__logout">
      <FaSignOutAlt aria-hidden="true" />
      <span>Log Out</span>
    </button>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="nav-side" aria-label="Main">
        {brand}
        <nav className="nav-side__list" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-side__item${isNavActive(item.path, pathname) ? ' is-active' : ''}`}
                aria-current={isNavActive(item.path, pathname) ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="nav-side__foot">{logoutButton}</div>
      </aside>

      {/* Phone top bar */}
      <header className="nav-top">
        {brand}
        {logoutButton}
      </header>

      {/* Phone bottom tabs */}
      <nav className="nav-tabs" aria-label="Primary navigation">
        {mobileNavigation.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isNavActive(item.path, pathname);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-tabs__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{item.label.replace('Invite ', '')}</span>
            </Link>
          );
        })}
      </nav>

      {guestBanner && !guestBanner.expired && (
        <div
          className={`header__guest-banner${guestBanner.warning ? ' header__guest-banner--warning' : ''}`}
          role="status"
        >
          <div className="header__guest-copy">
            <strong className="header__demo-badge">Guest</strong>
            <span>
              Private to this phone · deleted{' '}
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
            {resettingDemo ? 'Resetting…' : 'Start over'}
          </button>
          {demoResetError && (
            <span className="header__demo-error" role="alert">
              {demoResetError}
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default Header;
