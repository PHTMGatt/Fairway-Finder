import { Link } from 'react-router-dom';
import { MouseEvent } from 'react';
import Auth from '../../utils/auth';
import './style.css';

const Header = () => {
  const logout = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    Auth.logout();
  };

  return (
    <header className="header">
      <div className="header__inner container">
        <Link className="header__logo" to="/">
          <h1>🏌️ Fairway Finder</h1>
        </Link>
        <p className="header__tagline">Plan your ultimate golf road trip.</p>
        <div className="header__actions">
          {Auth.loggedIn() ? (
            <>
              <Link className="btn btn-primary header__btn" to="/dashboard">
                View My Trips
              </Link>
              <button className="btn btn-light header__btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-primary header__btn" to="/login">
                Login
              </Link>
              <Link className="btn btn-light header__btn" to="/signup">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
