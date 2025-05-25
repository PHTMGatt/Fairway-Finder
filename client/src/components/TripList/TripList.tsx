// client/src/components/TripList.tsx
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { DELETE_TRIP } from '../../utils/mutations';
import { QUERY_TRIPS } from '../../utils/queries';
import './TripList.css';

interface TripListProps {
  trips: any[];
  title: string;
}

const TripList: React.FC<TripListProps> = ({ trips = [], title }) => {
  const [deleteTrip] = useMutation(DELETE_TRIP, {
    update(cache, { data: { deleteTrip } }) {
      cache.modify({
        fields: {
          trips(existingTrips = [], { readField }) {
            return existingTrips.filter(
              (tripRef: any) => readField('_id', tripRef) !== deleteTrip._id
            );
          },
        },
      });
    },
  });

  const handleDelete = async (tripId: string) => {
    try {
      await deleteTrip({ variables: { tripId } });
    } catch (err) {
      console.error('❌ Error deleting trip:', err);
    }
  };

  const handleDeleteAll = async () => {
    for (const trip of trips) {
      await handleDelete(trip._id);
    }
  };

  if (!trips.length) {
    return <h3 className="trip-list__empty">No Trips Planned Yet</h3>;
  }

  return (
    <div className="trip-list">
      <h3 className="trip-list__title">{title || 'Saved Trips'}</h3>
      <button className="trip-list__delete-all" onClick={handleDeleteAll}>
        🗑️ Delete All Trips
      </button>
      <div className="trip-list__grid">
        {trips.map((trip) => (
          <div key={trip._id} className="trip-card">
            <h4 className="trip-card__header">
              <span>{trip.name}</span>
              <span>
                <span className="trip-card__count">
                  {trip.courses?.length || 0} course{trip.courses?.length !== 1 ? 's' : ''}
                </span>
                <button className="trip-card__delete" onClick={() => handleDelete(trip._id)}>
                  ❌
                </button>
              </span>
            </h4>
            <Link className="btn btn--light trip-card__btn" to={`/trip/${trip._id}`}>
              View Trip Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripList;
