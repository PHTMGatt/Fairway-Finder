// src/components/Header/Header.tsx

import { Link, useNavigate } from 'react-router-dom';
import { MouseEvent } from 'react';
import { useAuth } from '../../pages/Auth/AuthContext'; // ✅ Correct relative path
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth(); // ✅ Context hook for auth state

  // Note; Logs out the user and redirects to home
  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logout(); // Note; Clears token and updates context
    navigate('/');
  };

  return (
    <header className="header">
      {/* Note; App logo links back to home */}
      <div className="header__logo-cell">
        <Link to="/" className="header__logo">
          FAIRWAY FINDER
        </Link>
      </div>

      {/* Note; Six styled 'golf holes' */}
      <div className="header__holes">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="header__hole" />
        ))}
      </div>

      {/* Note; Spacer pushes auth buttons to right side */}
      <div className="header__spacer" />

      {/* Note; Show login/signup if not logged in, else My Trips and Logout */}
      <div className="header__actions">
        {isLoggedIn ? (
          <>
            <Link to="/me" className="header__btn">
              My Trips
            </Link>
            <button onClick={handleLogout} className="header__btn">
              Logout
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
