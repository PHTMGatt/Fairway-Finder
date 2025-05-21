import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';

import CourseList from '../../components/CourseList/CourseList';
import CourseForm from '../../components/CourseForm/CourseForm';
import Auth from '../../utils/auth';
import { QUERY_TRIP } from '../../utils/queries';
import './TripDetails.css';

const TripDetails: React.FC = () => {
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

  const trip = data?.trip;

  return (
    <main className="trip-detail container">
      {loading ? (
        <p>Loading trip…</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : !trip ? (
        <p>Trip not found.</p>
      ) : (
        <>
          <h2 className="trip-detail__title">{trip.name}</h2>
          <section className="trip-detail__courses">
            <CourseList
              courses={trip.courses?.map((c: any) => c.name) || []}
              isLoggedInUser
            />
            <CourseForm tripId={trip._id} />
          </section>
        </>
      )}
    </main>
  );
};

export default TripDetails;
