import { useLocation, useNavigate } from 'react-router-dom';
import './style.css';

const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <footer className="footer">
      <div className="footer__inner container text-center">
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

// This component is a functional React component that displays a footer with a "Go Back" button and a copyright notice.