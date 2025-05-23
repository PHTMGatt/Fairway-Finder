import { Link } from 'react-router-dom';
import './TripList.css';

// Note; Props: list of trips and an optional title
interface TripListProps {
  trips: any[];
  title: string;
}

const TripList: React.FC<TripListProps> = ({ trips = [], title }) => {
  // Note; Empty state fallback
  if (!trips.length) {
    return <h3 className="trip-list__empty">No Trips Planned Yet</h3>;
  }

  return (
    <div className="trip-list">
      <h3 className="trip-list__title">{title || 'Saved Trips'}</h3>
      <div className="trip-list__grid">
        {trips.map((trip) => (
          <div key={trip._id} className="trip-card">
            <h4 className="trip-card__header">
              {trip.name}
              <span className="trip-card__count">
                {trip.courses?.length || 0} course{trip.courses?.length !== 1 ? 's' : ''}
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
