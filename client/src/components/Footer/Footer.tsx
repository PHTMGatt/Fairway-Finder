import { useLocation, useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const location = useLocation(); // Note; Track current route
  const navigate = useNavigate(); // Note; Hook for navigation actions

  // Note; Navigate back if possible, otherwise go home
  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <footer className="footer">
      <div className="footer__inner container text-center">
        {/* Note; Show Go Back button on all pages except home */}
        {location.pathname !== '/' && (
          <button className="btn btn-dark footer__back" onClick={handleGoBack}>
            &larr; Go Back
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
