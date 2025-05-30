import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import lawnmower from '../../assets/images/lawnmower.gif';
import './Footer.css';

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
    <div className="footer-wrapper">
      {/* Mower rolling just above footer */}
      <Link to="https://github.com/PHTMGatt/Fairway-Finder" className="footer__mower-link" aria-label="Home">
        <img src={lawnmower} alt="Lawn mower rolling" className="footer__mower" />
      </Link>

      <footer className="footer">
        <div className="footer__inner container text-center">
          {location.pathname !== '/' && (
            <button className="btn footer__back" onClick={handleGoBack}>
              ← Go Back
            </button>
          )}
          <p className="footer__copy">&copy; {new Date().getFullYear()} Fairway Finder Golf Co.</p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;

