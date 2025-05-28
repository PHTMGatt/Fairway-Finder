// src/pages/Dashboard/Dashboard.tsx

import React from 'react';
import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './DashBoard.css';

const Dashboard: React.FC = () => {
  const isLoggedIn = Auth.loggedIn();  // Note; always check auth flag
  // Note; Always call useQuery, but skip fetching if not logged in
  const { loading, error, data } = useQuery(QUERY_MY_TRIPS, {
    skip: !isLoggedIn,
  });

  // Note; Redirect to login if user is not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Note; Extract the trips array or default to empty
  const myTrips = data?.me?.trips || [];

  return (
    <main className="dashboard container">
      {/* Note; Page title */}
      <h2 className="dashboard__title">My Golf Road Trips</h2>

      {/* Note; Handle loading, error, or show trip list */}
      {loading ? (
        <p>Loading your trips…</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <TripList trips={myTrips} title="Your Trips" />
      )}
    </main>
  );
};

export default Dashboard;
