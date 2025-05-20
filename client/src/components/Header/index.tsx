import { Link } from 'react-router-dom';
import { MouseEvent } from 'react';
import Auth from '../../utils/auth';
import { FaFlag, FaMapMarkerAlt, FaCloudSun } from 'react-icons/fa';
import './style.css';

const Header = () => {
  const logout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    Auth.logout();
  };

  return (
    <header className="header">
      <Link to="/" className="header__logo">🏌️ Fairway Finder</Link>
      <div className="header__slots">
        <div className="header__slot"></div>
        <div className="header__slot"></div>
        <div className="header__slot"></div>
      </div>
      <div className="header__actions">
        {Auth.loggedIn() ? (
          <>
            <Link to="/dashboard" className="btn header__btn">My Trips</Link>
            <button onClick={logout} className="btn header__btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login"  className="btn header__btn">Login</Link>
            <Link to="/signup" className="btn header__btn">Signup</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
