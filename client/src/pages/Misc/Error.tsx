import { useRouteError } from 'react-router-dom';
import './Error.css';

// Note; Define error shape returned by the router
interface RouteError {
  statusText?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  // Note; Grab error from React Router
  const error = useRouteError() as RouteError;
  console.error(error); // Optional: useful for debugging in dev

  return (
    <div className="error-page">
      <h1 className="error-page__title">Whoops! You’ve hit a sand trap!</h1>
      <p className="error-page__desc">Sorry, something went off course.</p>
      <p className="error-page__info">
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
};

export default ErrorPage;
