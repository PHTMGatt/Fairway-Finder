// src/pages/Dashboard/DashBoard.tsx

import React from 'react';
import { useQuery } from '@apollo/client';
import { Link, Navigate } from 'react-router-dom';
import { FaFlagCheckered, FaSearch } from 'react-icons/fa';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './DashBoard.css';

const Dashboard: React.FC = () => {
  const isLoggedIn = Auth.loggedIn();
  const { loading, error, data } = useQuery(QUERY_MY_TRIPS, {
    skip: !isLoggedIn,
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const myTrips = data?.me?.trips || [];

  return (
    <main className="dashboard">
      <header className="dashboard__hero">
        <div>
          <p className="dashboard__eyebrow">Your Fairway Finder</p>
          <h1 className="dashboard__title">Golf trips, ready when the group is.</h1>
          <p className="dashboard__intro">
            Jump back into a saved trip or start with a new course. This is the shortest path into weather, routes, players, and scores.
          </p>
        </div>
        <div className="dashboard__actions">
          <Link to="/courses" className="dashboard__action dashboard__action--secondary">
            <FaSearch aria-hidden="true" />
            Find Courses
          </Link>
          <Link to="/plan-trip" className="dashboard__action">
            <FaFlagCheckered aria-hidden="true" />
            Plan a Trip
          </Link>
        </div>
      </header>

      <section className="dashboard__content" aria-labelledby="dashboard-trips-title">
        <div className="dashboard__section-heading">
          <div>
            <p className="dashboard__eyebrow">Trip workspace</p>
            <h2 id="dashboard-trips-title">
              {myTrips.length} {myTrips.length === 1 ? 'trip' : 'trips'} on your board
            </h2>
          </div>
          <p>Open any trip to continue planning or manage game-day details.</p>
        </div>

        {loading ? (
          <div className="dashboard__status" role="status">
            <span className="dashboard__status-dot" aria-hidden="true" />
            <span>Loading your trips…</span>
          </div>
        ) : error ? (
          <div className="dashboard__status dashboard__status--error" role="alert">
            <strong>Could not load your trips.</strong>
            <span>{error.message}</span>
          </div>
        ) : (
          <TripList trips={myTrips} title="" />
        )}
      </section>
    </main>
  );
};

export default Dashboard;
