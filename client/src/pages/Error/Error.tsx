// src/pages/Error/Error.tsx

import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import './Error.css';

// Note; Shape of error object from React Router
interface RouteError {
  statusText?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  // Note; Retrieve the error thrown during routing
  const error = useRouteError() as RouteError;

  // Note; Derive a user‐friendly message
  const errorInfo = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error.statusText || error.message || 'Unknown error';

  return (
    <div className="error-page">
      {/* Note; Main error heading */}
      <h1 className="error-page__title">
        Whoops! You’ve hit a sand trap!
      </h1>

      {/* Note; Brief apology */}
      <p className="error-page__desc">
        Sorry, something went off course.
      </p>

      {/* Note; Detailed error info */}
      <p className="error-page__info">
        <i>{errorInfo}</i>
      </p>
    </div>
  );
};

export default ErrorPage;
