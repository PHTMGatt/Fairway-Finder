// src/pages/Dashboard/Dashboard.tsx

import React from 'react';
import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  // Note; Redirect to login if user is not authenticated
  if (!Auth.loggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // Note; Fetch the currently logged-in user's trips
  const { loading, error, data } = useQuery(QUERY_MY_TRIPS);

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

      {/* Note; TripForm removed as per latest refactor */}
    </main>
  );
};

export default Dashboard;
