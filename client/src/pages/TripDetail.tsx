import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';

import CourseList from '../components/CourseList';
import CourseForm from '../components/CourseForm';
import Auth from '../utils/auth';
import { QUERY_TRIP, QUERY_MY_TRIPS } from '../utils/queries';
import './TripDetails.css';

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();

  if (!Auth.loggedIn()) {
    return <Navigate to="/login" replace />;
  }
  if (!tripId) {
    return <Navigate to="/dashboard" replace />;
  }

  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
  });

  const trip = data?.trip || {};

  return (
    <main className="trip-detail container">
      {loading ? (
        <p>Loading trip…</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <>
          <h2 className="trip-detail__title">{trip.name}</h2>
          <section className="trip-detail__courses">
            <CourseList courses={trip.courses?.map((c:any) => c.name)} isLoggedInUser />
            <CourseForm tripId={trip._id} />
          </section>
        </>
      )}
    </main>
  );
};

export default TripDetail;
