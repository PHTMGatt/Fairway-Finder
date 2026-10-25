// src/components/TripList/TripList.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { DELETE_TRIP } from '../../utils/mutations';
import './TripList.css';

interface Trip {
  _id: string;
  name: string;
  courses?: any[];
}

interface TripListProps {
  trips?: Trip[];
  title?: string;
}

type DeleteTripMutation = (options: {
  variables: { tripId: string };
}) => Promise<unknown>;

const DEFAULT_DELETE_ERROR = 'Could not delete trip. Please try again.';

export const deleteTripWithConfirmation = async (
  trip: Pick<Trip, '_id' | 'name'>,
  deleteTrip: DeleteTripMutation,
  confirmDelete: (message: string) => boolean
): Promise<string | null> => {
  if (!confirmDelete(`Delete "${trip.name}"? This cannot be undone.`)) {
    return null;
  }

  try {
    await deleteTrip({ variables: { tripId: trip._id } });
    return null;
  } catch (error: unknown) {
    return error instanceof Error && error.message
      ? error.message
      : DEFAULT_DELETE_ERROR;
  }
};

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
  const [deleteTrip] = useMutation(DELETE_TRIP, {
    update(cache, { data: { deleteTrip } }) {
      cache.modify({
        fields: {
          trips(existingTripRefs = [], { readField }) {
            return existingTripRefs.filter(
              (tripRef: any) => readField('_id', tripRef) !== deleteTrip._id
            );
          },
        },
      });
    },
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
    return <h3 className="trip-list__empty">No Trips Planned Yet</h3>;
  }

  return (
    <div className="trip-list">
      <h3 className="trip-list__title">{title}</h3>
      <TripDeleteError message={deleteError} />

      <div className="trip-list__grid">
        {trips.map((trip) => (
          <div key={trip._id} className="trip-card">
            <div className="trip-card__header">
              <span>{trip.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="trip-card__count">
                  {trip.courses?.length ?? 0} course
                  {trip.courses?.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  className="trip-card__delete"
                  aria-label={`Delete ${trip.name}`}
                  onClick={() => void handleDeleteTrip(trip)}
                >
                  ❌
                </button>
              </span>
            </div>

            <Link to={`/trip/${trip._id}`} className="trip-card__btn">
              View Trip Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripList;
