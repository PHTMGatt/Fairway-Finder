import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { useMutation } from '@apollo/client';
import { ADD_TRIP } from '../../utils/mutations';
import { QUERY_TRIPS } from '../../utils/queries';
import './PlanTrip.css';

interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
}

interface AddTripInput {
  name: string;
  date: string;
  courseName: string;
}

const PlanTrip: React.FC = () => {
  const { isLoggedIn } = useAuth();              // Note; get auth state
  const navigate = useNavigate();

  // Note; Redirect to /login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) navigate('/login');
  }, [isLoggedIn, navigate]);
  if (!isLoggedIn) return null;                  // Note; nothing while redirecting

  // Note; City search state & results
  const [searchCity, setSearchCity] = useState<string>('');
  const [courseOptions, setCourseOptions] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState<boolean>(false);
  const [courseError, setCourseError] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Note; New trip details state
  const [tripName, setTripName] = useState<string>('');
  const [tripDate, setTripDate] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  // Note; GraphQL mutation to create a trip and refresh the trip list
  const [addTrip, { loading: savingTrip }] = useMutation(ADD_TRIP, {
    refetchQueries: [{ query: QUERY_TRIPS }],
  });

  // Note; Handler for searching courses by city
  const handleCourseSearch = async (e: FormEvent) => {
    e.preventDefault();
    setCourseOptions([]); setCourseError(''); setSelectedCourse(null);

    const city = searchCity.trim();
    if (!city) {
      setCourseError('Please enter a city name.');
      return;
    }

    setCourseLoading(true);
    try {
      const res = await fetch(`/api/courses?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const courses: Course[] = await res.json();

      if (courses.length === 0) {
        setCourseError(`No courses found for “${city}.”`);
      } else {
        setCourseOptions(courses);
      }
    } catch {
      setCourseError('Could not load courses.');
    } finally {
      setCourseLoading(false);
    }
  };

  // Note; Handler for saving the new trip once a course is selected
  const handleTripSave = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!tripName.trim() || !tripDate || !selectedCourse) {
      setSubmitError('All fields (name, date, course) are required.');
      return;
    }

    const input: AddTripInput = {
      name: tripName.trim(),
      date: tripDate,
      courseName: selectedCourse.name,
    };

    try {
      const { data } = await addTrip({ variables: { input } });
      const newId = data?.addTrip?._id;
      if (!newId) throw new Error('Trip creation failed.');

      // Note; Pass both date & city into TripDetails
      navigate(
        `/trip/${newId}`,
        { state: { date: tripDate, city: searchCity.trim() } }
      );
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong.');
    }
  };

  return (
    <main className="plan-trip">
      <h2 className="plan-trip__title">Plan a Trip</h2>

      {/* Note; Search courses by city */}
      <form className="plan-trip__form" onSubmit={handleCourseSearch}>
        <input
          className="plan-trip__input"
          type="text"
          placeholder="Search city for courses..."
          value={searchCity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchCity(e.target.value)}
          disabled={courseLoading}
        />
        <button
          className="plan-trip__btn"
          type="submit"
          disabled={courseLoading}
        >
          {courseLoading ? 'Searching…' : 'Find Courses'}
        </button>
      </form>
      {courseError && <p className="plan-trip__error">{courseError}</p>}

      {/* Note; Course results */}
      {courseOptions.length > 0 && (
        <ul className="plan-trip__results">
          {courseOptions.map((course) => (
            <li
              key={course.place_id}
              className={
                `plan-trip__result-item` +
                (selectedCourse?.place_id === course.place_id ? ' selected' : '')
              }
              onClick={() => setSelectedCourse(course)}
            >
              <strong>{course.name}</strong><br />
              <small>{course.address}</small>
            </li>
          ))}
        </ul>
      )}

      {/* Note; Confirmation of selected course */}
      {selectedCourse && (
        <div className="plan-trip__confirmation">
          ✅ Selected Course: <strong>{selectedCourse.name}</strong>
        </div>
      )}

      {/* Note; Save trip form */}
      <form className="plan-trip__form" onSubmit={handleTripSave}>
        <input
          className="plan-trip__input"
          type="text"
          placeholder="Trip name..."
          value={tripName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTripName(e.target.value)}
        />
        <input
          className="plan-trip__input"
          type="date"
          value={tripDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTripDate(e.target.value)}
        />
        <button
          className="plan-trip__btn"
          type="submit"
          disabled={savingTrip}
        >
          {savingTrip ? 'Saving…' : 'Save Trip'}
        </button>
      </form>
      {submitError && <p className="plan-trip__error">{submitError}</p>}
    </main>
);
};

export default PlanTrip;
