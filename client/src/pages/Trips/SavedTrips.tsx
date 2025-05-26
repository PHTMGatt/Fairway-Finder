// client/src/pages/Trips/SavedTrips.tsx

import React from 'react';
import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_TRIPS } from '../../utils/queries';
import './SavedTrips.css';

const SavedTrips: React.FC = () => {
  // Note; Redirect non-authenticated users to login
  if (!Auth.loggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // Note; Fetch all trips the user has created
  const { loading, error, data } = useQuery(QUERY_TRIPS);

  const trips = data?.trips || [];

  // Note; Show loading or error states
  if (loading) {
    return <p className="saved-trips__status">Loading saved trips…</p>;
  }
  if (error) {
    return (
      <p className="saved-trips__status">
        ❌ Error loading saved trips: {error.message}
      </p>
    );
  }

  return (
    <main className="saved-trips container">
      {/* Note; Page title */}
      <h2 className="saved-trips__title">Your Saved Trips</h2>

      {/* Note; Reuse TripList to render the grid */}
      <TripList trips={trips} title="" />
    </main>
  );
};

export default SavedTrips;
