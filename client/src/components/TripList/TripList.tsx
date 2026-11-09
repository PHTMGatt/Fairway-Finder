// src/components/TripList/TripList.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { FaTrashAlt } from 'react-icons/fa';
import { DELETE_TRIP } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import {
  deleteTripWithConfirmation,
  formatTripDate,
  sortTripsForDisplay,
} from './TripList.utils';
import './TripList.css';

interface TripCourseSummary {
  name?: string | null;
}

interface Trip {
  _id: string;
  name: string;
  date?: string | null;
  courses?: TripCourseSummary[];
}

interface TripListProps {
  trips?: Trip[];
  title?: string;
}

export const TripDeleteError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <p className="trip-list__error" role="alert">
      {message}
    </p>
  ) : null;

const TripList: React.FC<TripListProps> = ({
  trips = [],
  title = 'Saved Trips',
}) => {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // The trip lists read `me { trips }` (and sometimes root `trips`). Evicting the
  // Trip entity drops it from every list that references it; the old code only
  // edited root `trips`, so My Trips kept showing a trip that was already deleted.
  const [deleteTrip] = useMutation(DELETE_TRIP, {
    update(cache, { data }) {
      const deleted = data?.deleteTrip;
      if (!deleted?._id) return;
      cache.evict({ id: cache.identify({ __typename: 'Trip', _id: deleted._id }) });
      cache.gc();
    },
    refetchQueries: [QUERY_MY_TRIPS],
  });

  const handleDeleteTrip = async (trip: Trip) => {
    setDeleteError(null);
    const message = await deleteTripWithConfirmation(
      trip,
      (options) => deleteTrip(options),
      (prompt) => window.confirm(prompt)
    );
    setDeleteError(message);
  };

  if (trips.length === 0) {
    return <h3 className="trip-list__empty">No trips planned yet.</h3>;
  }

  const visibleTrips = sortTripsForDisplay(trips);

  return (
    <div className="trip-list">
      {title && <h3 className="trip-list__title">{title}</h3>}
      <TripDeleteError message={deleteError} />

      <div className="trip-list__grid">
        {visibleTrips.map((trip) => {
          const courseName = trip.courses?.[0]?.name?.trim() || 'Course not set';

          return (
            <article key={trip._id} className="trip-card">
              <div className="trip-card__header">
                <div className="trip-card__heading">
                  <span className="trip-card__date">{formatTripDate(trip.date)}</span>
                  <h4 className="trip-card__name">{trip.name}</h4>
                </div>
                <button
                  type="button"
                  className="trip-card__delete"
                  aria-label={`Delete ${trip.name}`}
                  title={`Delete ${trip.name}`}
                  onClick={() => void handleDeleteTrip(trip)}
                >
                  <FaTrashAlt aria-hidden="true" />
                </button>
              </div>

              <div className="trip-card__body">
                <span className="trip-card__label">Course</span>
                <strong className="trip-card__course">{courseName}</strong>
                {trip.courses && trip.courses.length > 1 && (
                  <span className="trip-card__count">
                    +{trip.courses.length - 1} more course
                    {trip.courses.length - 1 !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <Link to={`/trip/${trip._id}`} className="trip-card__btn">
                Open Trip
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default TripList;
