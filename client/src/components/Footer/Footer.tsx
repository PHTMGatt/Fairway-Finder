import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Footer.css';
import lawnmowerGif from '../../assets/images/lawnmower.gif'; // Adjust path if needed

const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <footer className="footer">
      {/* GIF positioned above footer content */}
      <a href="https://github.com/PHTMGatt/Fairway-Finder" target="_blank" rel="noopener noreferrer" className="footer__gif-link">
        <img
          src={lawnmowerGif}
          alt="Lawnmower animation"
          className="footer__gif-above"
        />
      </a>

      <div className="footer__inner container text-center">
        {location.pathname !== '/' && (
          <button className="btn footer__back" onClick={handleGoBack}>
            ← Go Back
          </button>
        )}

        <p className="footer__copy">
          &copy; {new Date().getFullYear()} Fairway Finder Golf Co.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

