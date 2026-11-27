// client/src/pages/Trips/TripDetails.tsx
// Game day first: the scorecard sits right under the trip title; course + weather follow.
import React from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { QUERY_TRIP } from '../../utils/queries';
import Notice from '../../components/ui/Notice';
import { PageHeader, Panel } from '../../components/ui/primitives';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import TripCoursePanel, { TripCourse } from './TripCoursePanel';
import TripWeatherPanel from './TripWeatherPanel';
import { useTeeRating } from './useTeeRating';
import './TripDetails.css';

const Status: React.FC<{ tone?: 'info' | 'danger'; children: React.ReactNode }> = ({
  tone = 'info',
  children,
}) => (
  <main className="trip-details">
    <Notice tone={tone} className="trip-details__status">
      {children}
    </Notice>
  </main>
);

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId,
  });
  const trip = data?.trip;
  const course: TripCourse | undefined = trip?.courses?.[0];
  const tee = useTeeRating(course);

  if (!tripId) return <Status tone="danger">No trip ID provided.</Status>;
  if (loading) return <Status>Loading trip details…</Status>;
  if (error || !trip) {
    return <Status tone="danger">Error loading trip: {error?.message || 'Trip not found'}</Status>;
  }

  return (
    <main className="trip-details">
      <PageHeader
        title={trip.name}
        subtitle={[trip.date || 'Date not set', course?.name].filter(Boolean).join(' · ')}
        className="trip-details__header"
      />

      <Panel title="Players & scorecard" className="trip-details__scorecard">
        <ScoreCard
          tripId={tripId}
          courseRating={tee.teeRating?.courseRating ?? null}
          slope={tee.teeRating?.slopeRating ?? null}
        />
      </Panel>

      <TripCoursePanel course={course} teeRating={tee.teeRating} teeError={tee.error} />
      <TripWeatherPanel course={course} tripDate={trip.date} />
    </main>
  );
};

export default TripDetails;
