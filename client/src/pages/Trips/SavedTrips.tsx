// src/pages/Trips/SavedTrips.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_TRIPS } from '../../utils/queries';
import './SavedTrips.css';

const SavedTrips: React.FC = () => {
  const isLoggedIn = Auth.loggedIn();  // Note; Check user authentication status

  // Note; Fetch trips but skip GraphQL call if not authenticated
  const { loading, error, data } = useQuery(QUERY_TRIPS, {
    skip: !isLoggedIn,
  });

  // Note; Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Note; Show loading state
  if (loading) {
    return <p className="saved-trips__status">Loading saved trips…</p>;
  }
  // Note; Show error state
  if (error) {
    return (
      <p className="saved-trips__status">
        ❌ Error loading saved trips: {error.message}
      </p>
    );
  }

  const trips = data?.trips || [];     // Note; Default to empty array

  // Note; Render the list of saved trips
  return (
    <main className="saved-trips">
      <h2 className="saved-trips__title">Your Saved Trips</h2>
      <TripList trips={trips} title="" />
    </main>
  );
};

export default SavedTrips;
