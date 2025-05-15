import { useLocation, useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if(window.history.length > 1) { //Check if there is a previous page in the history stack
      navigate(-1);
    } else {
      navigate('/');
    }
  }
  
  return (
    <footer className="w-100 mt-auto text-dark p-4">
      <div className="container text-center mb-5">
        {location.pathname !== '/' && (
          <button
            className="btn btn-dark mb-3"
            onClick={handleGoBack}
          >
            &larr; Go Back
          </button>
        )}
        <h4>&copy; {new Date().getFullYear()} - Tech Friends</h4>
      </div>
    </footer>
  );
};

export default Footer;
