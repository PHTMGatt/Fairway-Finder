// src/components/Header/Header.tsx

import React, { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();                 // Note; Hook to programmatically navigate
  const { isLoggedIn, logout } = useAuth() as any; // Note; Auth context for login state (cast to any so logout is recognized)

  // Note; Logs out the user and returns them to the home page
  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      {/* Note; Logo section linking back to home */}
      <div className="header__logo-cell">
        <Link to="/" className="header__logo">
          FAIRWAY FINDER
        </Link>
      </div>

      {/* Note; Decorative “golf holes” */}
      <div className="header__holes">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="header__hole" />
        ))}
      </div>

      {/* Note; Spacer to push action buttons to the right */}
      <div className="header__spacer" />

      {/* Note; Authentication action buttons */}
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
