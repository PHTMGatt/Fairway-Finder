import React from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import Auth from '../../utils/auth';
import './Error.css';

interface RouteError {
  statusText?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError;
  const errorInfo = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error.statusText || error.message || 'The requested page could not be loaded.';
  const isLoggedIn = Auth.loggedIn();

  return (
    <main className="error-page">
      <section className="error-page__card" aria-labelledby="error-title">
        <p className="error-page__eyebrow">Fairway Finder</p>
        <h1 id="error-title" className="error-page__title">
          That page is off course.
        </h1>
        <p className="error-page__desc">
          The page may have moved, the link may be stale, or something failed while loading.
        </p>
        <p className="error-page__info" role="status">{errorInfo}</p>

        <div className="error-page__actions">
          <Link to="/" className="error-page__action error-page__action--primary">
            Go Home
          </Link>
          <Link
            to={isLoggedIn ? '/plan-trip' : '/courses'}
            className="error-page__action"
          >
            {isLoggedIn ? 'Plan a Trip' : 'Browse Courses'}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ErrorPage;
