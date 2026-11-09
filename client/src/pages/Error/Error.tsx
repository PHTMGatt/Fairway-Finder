// src/pages/Error/Error.tsx
// Used twice: as the router errorElement (crashes) and as the in-app "*" route
// (unknown URLs), where it renders inside the normal shell with the sidebar.

import React from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import './Error.css';

interface RouteError {
  statusText?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError | undefined;
  const { isLoggedIn } = useAuth();

  const errorInfo = !error
    ? '404 · Page not found'
    : isRouteErrorResponse(error)
      ? `${error.status} · ${error.statusText}`
      : error.statusText || error.message || 'Unknown error';

  return (
    <div className="error-page">
      <h1 className="error-page__title">Whoops! You’ve hit a sand trap.</h1>
      <p className="error-page__desc">Sorry, something went off course.</p>
      <p className="error-page__info">{errorInfo}</p>
      <Link to={isLoggedIn ? '/me' : '/'} className="error-page__home">
        Back to the clubhouse
      </Link>
    </div>
  );
};

export default ErrorPage;
