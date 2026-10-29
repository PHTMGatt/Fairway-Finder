// src/pages/Trips/SavedTrips.tsx

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { FaFlagCheckered, FaSearch } from 'react-icons/fa';
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

  const trips = data?.trips || [];

  return (
    <main className="saved-trips">
      <header className="saved-trips__hero">
        <div>
          <p className="saved-trips__eyebrow">Trip hub</p>
          <h1 className="saved-trips__title">Your golf trips</h1>
          <p className="saved-trips__intro">
            Keep upcoming rounds, courses, players, weather, routes, and scores connected in one place.
          </p>
        </div>
        <div className="saved-trips__actions">
          <Link to="/courses" className="saved-trips__action saved-trips__action--secondary">
            <FaSearch aria-hidden="true" />
            Find a Course
          </Link>
          <Link to="/plan-trip" className="saved-trips__action">
            <FaFlagCheckered aria-hidden="true" />
            Plan New Trip
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="saved-trips__status" role="status">
          <span className="saved-trips__status-dot" aria-hidden="true" />
          <div>
            <strong>Loading your trip board…</strong>
            <span>Pulling together saved golf plans and course details.</span>
          </div>
        </div>
      ) : error ? (
        <div className="saved-trips__status saved-trips__status--error" role="alert">
          <div>
            <strong>Could not load your trips.</strong>
            <span>{error.message}</span>
          </div>
        </div>
      ) : (
        <section className="saved-trips__board" aria-labelledby="saved-trips-board-title">
          <div className="saved-trips__board-heading">
            <div>
              <p className="saved-trips__eyebrow">Saved plans</p>
              <h2 id="saved-trips-board-title">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} in your hub
              </h2>
            </div>
            <p>Open a trip to manage the course, route, weather, players, and scorecard.</p>
          </div>
          <TripList trips={trips} title="" />
        </section>
      )}
    </main>
  );
};

export default SavedTrips;
