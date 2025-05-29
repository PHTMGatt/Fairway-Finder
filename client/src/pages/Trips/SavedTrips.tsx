import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import TripList from '../../components/TripList/TripList';
import Auth from '../../utils/auth';
import { QUERY_TRIPS } from '../../utils/queries';
import './SavedTrips.css';

const SavedTrips: React.FC = () => {
  const isLoggedIn = Auth.loggedIn();  // Note; auth check (always called)

  // Note; fetch trips unconditionally, but skip if not logged in
  const { loading, error, data } = useQuery(QUERY_TRIPS, {
    skip: !isLoggedIn
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

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

  const trips = data?.trips || [];

  return (
    <main className="saved-trips">
      <h2 className="saved-trips__title">Your Saved Trips</h2>
      <TripList trips={trips} title="" />
    </main>
  );
};

export default SavedTrips;
