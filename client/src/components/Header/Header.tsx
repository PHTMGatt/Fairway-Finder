import { Link } from 'react-router-dom';
import { MouseEvent } from 'react';
import { useAuth } from '../../pages/Auth/AuthContext';
import golfGif from '../../assets/images/golf2.gif';
import './Header.css';

// Note; remastered Header to use isLoggedIn + logoutUser from context
const Header: React.FC = () => {
  const { isLoggedIn, logoutUser } = useAuth();

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logoutUser(); // clears token and sets isLoggedIn=false immediately
  };

  return (
    <header className="header header--bg">
      {/* Animated icon links to home */}
      <Link to="/" className="header__icon-link">
        <img src={golfGif} alt="Home" className="header__gif-icon" />
      </Link>

      {/* Center title link */}
      <Link to="/" className="header__logo">
        FAIRWAY FINDER
      </Link>

      {/* Spacer pushes buttons right */}
      <div className="header__spacer" />

      {/* Auth buttons (now using isLoggedIn from context) */}
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
    </header>
  );
};

export default Header;
