import React from 'react';
import { useRouteError } from 'react-router-dom';
import './Error.css';

interface RouteError {
  statusText?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError;
  console.error(error);

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
