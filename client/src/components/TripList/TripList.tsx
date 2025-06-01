// src/components/TripList/TripList.tsx
import React from 'react';
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

const TripList: React.FC<TripListProps> = ({
  trips = [],
  title = 'Saved Trips',
}) => {
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

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip({ variables: { tripId } });
    } catch {
      // Silent fail
    }
  };

  const handleDeleteAllTrips = async () => {
    for (const trip of trips) {
      await handleDeleteTrip(trip._id);
    }
  };

  if (trips.length === 0) {
    return <h3 className="trip-list__empty">No Trips Planned Yet</h3>;
  }

  return (
    <div className="trip-list">
      <h3 className="trip-list__title">{title}</h3>
      <button className="trip-list__delete-all" onClick={handleDeleteAllTrips}>
        🗑️ Delete All Trips
      </button>

      <div className="trip-list__grid">
        {trips.map((trip) => (
          <div key={trip._id} className="trip-card">
            {/* Note; card header with name and delete button */}
            <div className="trip-card__header">
              <span>{trip.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="trip-card__count">
                  {trip.courses?.length ?? 0} course
                  {trip.courses?.length !== 1 ? 's' : ''}
                </span>
                <button
                  className="trip-card__delete"
                  onClick={() => handleDeleteTrip(trip._id)}
                >
                  ❌
                </button>
              </span>
            </div>

            {/* Note; view trip details CTA */}
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
