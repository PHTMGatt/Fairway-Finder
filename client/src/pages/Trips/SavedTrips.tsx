// src/pages/Trips/SavedTrips.tsx

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_TRIPS } from '../../utils/queries';
import './SavedTrips.css';

const SavedTrips: React.FC = () => {
  const isLoggedIn = Auth.loggedIn();

  const { loading, error, data } = useQuery(QUERY_TRIPS, {
    skip: !isLoggedIn,
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <p className="saved-trips__status">Loading saved trips…</p>;
  }

  if (error) {
    return (
      <p className="saved-trips__status saved-trips__status--error" role="alert">
        Error loading saved trips: {error.message}
      </p>
    );
  }

  const trips = data?.trips || [];

  return (
    <main className="saved-trips">
      <header className="saved-trips__header">
        <div>
          <p className="saved-trips__eyebrow">Your golf plans</p>
          <h1 className="saved-trips__title">Saved Trips</h1>
          <p className="saved-trips__intro">
            Open an upcoming trip to check the course, weather, route, players, and scores.
          </p>
        </div>
        <Link to="/plan-trip" className="saved-trips__new">
          Plan New Trip
        </Link>
      </header>

      {trips.length ? (
        <TripList trips={trips} title="" />
      ) : (
        <section className="saved-trips__empty">
          <h2>No trips planned yet</h2>
          <p>Choose a course and save your first trip so everything stays together.</p>
          <Link to="/plan-trip" className="saved-trips__new">
            Plan Your First Trip
          </Link>
        </section>
      )}
    </main>
  );
};

export default SavedTrips;
