// src/components/Footer/Footer.tsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  // Note; Get current path to decide when to show “Go Back”
  const location = useLocation();

  // Note; Hook for programmatic navigation
  const navigate = useNavigate();

  // Note; Navigate back if history exists, otherwise go to home page
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <footer className="footer">
      <div className="footer__inner container text-center">
        {/* Note; Show Go Back button on all routes except the home page */}
        {location.pathname !== '/' && (
          <button
            className="btn footer__back"
            onClick={handleGoBack}
          >
            ← Go Back
          </button>
        )}

        {/* Note; Copyright notice, dynamic year */}
        <p className="footer__copy">
          &copy; {new Date().getFullYear()} Fairway Finder Golf Co.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
