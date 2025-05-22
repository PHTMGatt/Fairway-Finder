// src/pages/Trips/TripDetails.tsx

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';

import CourseList from '../../components/CourseList/CourseList';
import CourseForm from '../../components/CourseForm/CourseForm';
import Auth from '../../utils/auth';
import { QUERY_TRIP } from '../../utils/queries';
import './TripDetails.css';

const TripDetails: React.FC = () => {
  // Note; Extract tripId from the URL params
  const { tripId } = useParams<{ tripId: string }>();

  // Note; Always call your hooks at the top, skip if no tripId
  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId,
  });

  // Note; Redirect if user isn't logged in
  if (!Auth.loggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // Note; Redirect if no tripId provided
  if (!tripId) {
    return <Navigate to="/dashboard" replace />;
  }

  // Note; Show loading state
  if (loading) {
    return <p className="trip-detail__status">Loading trip…</p>;
  }

  // Note; Show error state
  if (error) {
    return <p className="trip-detail__status">Error: {error.message}</p>;
  }

  // Note; If the query returns but no trip found
  const trip = data?.trip;
  if (!trip) {
    return <p className="trip-detail__status">Trip not found.</p>;
  }

  // Note; Main render once all data is ready
  return (
    <main className="trip-detail container">
      {/* Note; Show trip name */}
      <h2 className="trip-detail__title">{trip.name}</h2>

      {/* Note; Show course list and form */}
      <section className="trip-detail__courses">
        <CourseList
          courses={trip.courses?.map((c: any) => c.name) || []}
          isLoggedInUser={true}
        />
        <CourseForm tripId={trip._id} />
      </section>
    </main>
  );
};

export default TripDetails;
