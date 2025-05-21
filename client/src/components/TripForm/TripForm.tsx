import { useState, FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_TRIP } from '../../utils/mutations';
import { QUERY_TRIPS } from '../../utils/queries';
import './TripForm.css';

const TripForm: React.FC = () => {
  const [tripName, setTripName] = useState('');
  const [addTrip, { error }] = useMutation(ADD_TRIP, {
    refetchQueries: [QUERY_TRIPS, 'getAllTrips'],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addTrip({ variables: { name: tripName } });
      setTripName('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="trip-form">
      <h3 className="trip-form__title">Plan a new golf trip:</h3>
      <form className="trip-form__form" onSubmit={handleSubmit}>
        <input
          className="trip-form__input"
          placeholder="Enter trip name..."
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
        <button className="btn btn--light trip-form__btn" type="submit">
          Add Trip
        </button>
      </form>
      {error && <p className="trip-form__error">Error: {error.message}</p>}
    </div>
  );
};

export default TripForm;
