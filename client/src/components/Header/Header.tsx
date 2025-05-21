import { Link } from 'react-router-dom';
import { MouseEvent } from 'react';
import Auth from '../../utils/auth';
import './Header.css';

const Header: React.FC = () => {
  const logout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    Auth.logout();
  };

  return (
    <header className="header">
      <div className="header__logo-cell">
        <Link to="/" className="header__logo">
          FAIRWAY FINDER
        </Link>
      </div>

      <div className="header__holes">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="header__hole" />
        ))}
      </div>

      <div className="header__spacer" />

      <div className="header__actions">
        {Auth.loggedIn() ? (
          <>
            <Link to="/dashboard" className="header__btn">
              My Trips
            </Link>
            <button onClick={logout} className="header__btn">
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
