// client/src/components/Footer/Footer.tsx
import React, { memo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__actions">
          {location.pathname !== '/' && (
            <button className="footer__back" onClick={handleGoBack}>
              ← Go Back
            </button>
          )}
          <Link to="/handicap" className="footer__link">
            Handicap
          </Link>
        </div>
        <p className="footer__copy">&copy; {new Date().getFullYear()} Fairway Finder Golf Co.</p>
      </div>
    </footer>
  );
});

export default Footer;
