// client/src/components/Footer/'Footer.tsx'
import React, { memo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import lawnmower from '../../assets/images/lawnmower.gif';
import './Footer.css';

//Note; Footer with animated mower icon linking to Handicap Tracker
const Footer: React.FC = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  //Note; Go back if possible, otherwise navigate home
  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="footer-wrapper">
      {/*Note; Clickable mower icon */}
      <Link to="/handicap" className="footer__mower-link" aria-label="Handicap Tracker">
        <img src={lawnmower} alt="Lawn mower rolling" className="footer__mower" />
      </Link>

      <footer className="footer">
        <div className="footer__inner">
          {/*Note; Conditionally show back button */}
          {location.pathname !== '/' && (
            <button className="footer__back" onClick={handleGoBack}>
              ← Go Back
            </button>
          )}
          {/*Note; Footer copyright */}
          <p className="footer__copy">&copy; {new Date().getFullYear()} Fairway Finder Golf Co.</p>
        </div>
      </footer>
    </div>
  );
});

export default Footer;
