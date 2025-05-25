import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_TRIP } from '../../utils/mutations';
import { QUERY_TRIPS } from '../../utils/queries';
import './TripForm.css';

interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
}

const TripForm: React.FC = () => {
  const navigate = useNavigate();

  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [city, setCity] = useState('');
  const [courseResults, setCourseResults] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [addTrip] = useMutation(ADD_TRIP, {
    refetchQueries: [QUERY_TRIPS],
    onError: (error) => {
      console.error('Mutation error:', error.message);
      setSubmitError(error.message || 'Not authenticated.');
    },
  });

  const fetchCourses = async (e: FormEvent) => {
    e.preventDefault();
    setSelectedCourse(null);
    setCourseError('');
    setCourseResults([]);

    if (!city.trim()) {
      setCourseError('Please enter a city name.');
      return;
    }

    setLoadingCourses(true);

    try {
      const res = await fetch(`/api/courses?city=${encodeURIComponent(city.trim())}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: Course[] = await res.json();

      if (!data.length) {
        setCourseError(`No courses found for “${city}”`);
      } else {
        setCourseResults(data);
      }
    } catch {
      setCourseError('Could not load courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setSubmitError('');

  if (!tripName || !tripDate || !selectedCourse) {
    setSubmitError('All fields including course selection are required.');
    return;
  }

  try {
    const input = {
      name: tripName,
      date: tripDate,
      courseName: selectedCourse.name,
    };

    console.log('🔄 Submitting trip input:', input);

    const tripRes = await addTrip({ variables: { input } });

    console.log('✅ Trip creation response:', tripRes);

    const tripId = tripRes.data?.addTrip?._id;
    if (!tripId) throw new Error('Trip creation failed or missing ID.');

    console.log('➡️ Navigating to trip:', tripId);

    navigate(`/trip/${tripId}`, { state: { tripDate } });
  } catch (err: any) {
    console.error('❌ Trip creation error:', err);
    setSubmitError(err.message || 'Something went wrong.');
  }
};


  return (
    <div className="trip-form">
      <h3 className="trip-form__title">Plan a new golf trip:</h3>

      <form className="trip-form__form" onSubmit={fetchCourses}>
        <input
          className="trip-form__input"
          placeholder="Search city for courses..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button className="trip-form__btn" type="submit" disabled={loadingCourses}>
          {loadingCourses ? 'Searching…' : 'Find Courses'}
        </button>
      </form>

      {courseError && <p className="trip-form__error">{courseError}</p>}

      {courseResults.length > 0 && (
        <ul className="trip-form__results">
          {courseResults.map((course) => (
            <li
              key={course.place_id}
              className={`trip-form__result-item ${
                selectedCourse?.place_id === course.place_id ? 'selected' : ''
              }`}
              onClick={() => setSelectedCourse(course)}
            >
              <strong>{course.name}</strong>
              <br />
              <small>{course.address}</small>
            </li>
          ))}
        </ul>
      )}

      {selectedCourse && (
        <div className="trip-form__confirmation">
          ✅ Selected Course: <strong>{selectedCourse.name}</strong>
        </div>
      )}

      <form className="trip-form__form" onSubmit={handleSubmit}>
        <input
          className="trip-form__input"
          placeholder="Trip name..."
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
        <input
          className="trip-form__input"
          type="date"
          value={tripDate}
          onChange={(e) => setTripDate(e.target.value)}
        />
        <button className="trip-form__btn" type="submit">
          Save Trip
        </button>
      </form>

      {submitError && <p className="trip-form__error">{submitError}</p>}
    </div>
  );
};

export default TripForm;
