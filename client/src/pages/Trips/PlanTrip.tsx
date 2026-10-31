// client/src/pages/Trips/PlanTrip.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { useMutation } from '@apollo/client';
import { ADD_TRIP } from '../../utils/mutations';
import { QUERY_TRIPS } from '../../utils/queries';
import { Alert } from 'react-bootstrap';
import { FaFlagCheckered, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import {
  CourseSearchResult,
  readPlanTripPrefill,
  toTripCourseInput,
} from './planTripCourse';
import './PlanTrip.css';

const PlanTrip: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [prefill] = useState(() => readPlanTripPrefill(location.state));

  const [searchCity, setSearchCity] = useState<string>(prefill.city);
  const [courseOptions, setCourseOptions] = useState<CourseSearchResult[]>([]);
  const [courseLoading, setCourseLoading] = useState<boolean>(false);
  const [courseError, setCourseError] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResult | null>(
    prefill.course
  );

  const [tripName, setTripName] = useState<string>('');
  const [tripDate, setTripDate] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const [addTrip, { loading: savingTrip }] = useMutation(ADD_TRIP, {
    refetchQueries: [{ query: QUERY_TRIPS }],
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleCourseSearch = async (e: FormEvent) => {
    e.preventDefault();
    setCourseOptions([]);
    setCourseError('');
    setSelectedCourse(null);

    const city = searchCity.trim();
    if (!city) {
      setCourseError('Please enter a city name.');
      return;
    }

    setCourseLoading(true);
    try {
      const res = await fetch(`/api/courses?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const courses: CourseSearchResult[] = await res.json();

      if (!courses.length) {
        setCourseError(`No courses found near “${city}.”`);
      } else {
        setCourseOptions(courses);
      }
    } catch {
      setCourseError('Could not load courses. Try again in a moment.');
    } finally {
      setCourseLoading(false);
    }
  };

  const handleTripSave = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!tripName.trim() || !tripDate || !selectedCourse) {
      setSubmitError('Trip name, date, and course are required.');
      return;
    }

    try {
      const { data } = await addTrip({
        variables: {
          input: {
            name: tripName.trim(),
            date: tripDate,
            course: toTripCourseInput(selectedCourse),
          },
        },
      });
      const newId = data?.addTrip?._id;
      if (!newId) throw new Error('Trip creation failed.');

      navigate(`/trip/${newId}`);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error && err.message ? err.message : 'Something went wrong.'
      );
    }
  };

  return (
    <main className="plan-trip">
      <header className="plan-trip__header">
        <p className="plan-trip__eyebrow">Build the golf getaway</p>
        <h1 className="plan-trip__title">
          <FaFlagCheckered className="plan-trip__icon" aria-hidden="true" />
          Plan a Trip
        </h1>
        <p className="plan-trip__intro">
          Start with the exact course, lock in the date, then open the trip workspace for weather, routing, players, and scores.
        </p>
      </header>

      <ol className="plan-trip__journey" aria-label="Fairway Finder trip workflow">
        <li className="plan-trip__journey-step plan-trip__journey-step--active">
          <span>01</span>
          <strong>Choose course</strong>
        </li>
        <li className="plan-trip__journey-step plan-trip__journey-step--active">
          <span>02</span>
          <strong>Name + date</strong>
        </li>
        <li className="plan-trip__journey-step">
          <span>03</span>
          <strong>Trip workspace</strong>
        </li>
        <li className="plan-trip__journey-step">
          <span>04</span>
          <strong>Play + score</strong>
        </li>
      </ol>

      <div className="plan-trip__workspace">
        <section className="plan-trip__section" aria-labelledby="course-step-title">
          <div className="plan-trip__step-heading">
            <span className="plan-trip__step-number">1</span>
            <div>
              <p className="plan-trip__section-kicker">Course</p>
              <h2 id="course-step-title">Choose where you are playing</h2>
              <p>Search by city, or continue with the course you selected in Course Finder.</p>
            </div>
          </div>

          <form className="plan-trip__form" onSubmit={handleCourseSearch}>
            <LocationAutocomplete
              value={searchCity}
              onChange={setSearchCity}
              placeholder="City, state"
              inputClassName="plan-trip__input"
              disabled={courseLoading}
              ariaLabel="Trip course city"
            />
            <button className="plan-trip__btn" type="submit" disabled={courseLoading}>
              {courseLoading ? 'Searching…' : 'Find Courses'}
            </button>
          </form>

          {courseError && (
            <Alert
              variant="danger"
              onClose={() => setCourseError('')}
              dismissible
              className="plan-trip__alert"
            >
              {courseError}
            </Alert>
          )}

          {courseOptions.length > 0 && (
            <ul className="plan-trip__results" aria-label="Course search results">
              {courseOptions.map((course) => {
                const selected = selectedCourse?.place_id === course.place_id;
                return (
                  <li key={course.place_id}>
                    <button
                      type="button"
                      className={`plan-trip__result-item${selected ? ' selected' : ''}`}
                      onClick={() => setSelectedCourse(course)}
                      aria-pressed={selected}
                    >
                      <span className="plan-trip__result-heading">
                        <strong>{course.name}</strong>
                        {typeof course.rating === 'number' && (
                          <small>
                            <FaStar aria-hidden="true" /> {course.rating.toFixed(1)}
                          </small>
                        )}
                      </span>
                      <span className="plan-trip__result-address">
                        <FaMapMarkerAlt aria-hidden="true" />
                        {course.address || 'Address unavailable'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedCourse ? (
            <div className="plan-trip__selection" role="status">
              <span className="plan-trip__selection-label">Selected course</span>
              <strong>{selectedCourse.name}</strong>
              <small>{selectedCourse.address}</small>
              {typeof selectedCourse.rating === 'number' && (
                <span className="plan-trip__selection-rating">
                  <FaStar aria-hidden="true" /> {selectedCourse.rating.toFixed(1)} rating
                </span>
              )}
            </div>
          ) : (
            <p className="plan-trip__hint">Choose one course to unlock the trip save step.</p>
          )}
        </section>

        <section className="plan-trip__section plan-trip__section--details" aria-labelledby="details-step-title">
          <div className="plan-trip__step-heading">
            <span className="plan-trip__step-number">2</span>
            <div>
              <p className="plan-trip__section-kicker">Trip details</p>
              <h2 id="details-step-title">Give the round a name and date</h2>
              <p>These details anchor the trip hub and keep the next actions easy to scan.</p>
            </div>
          </div>

          <form className="plan-trip__details-form" onSubmit={handleTripSave}>
            <label className="plan-trip__field">
              <span>Trip name</span>
              <input
                className="plan-trip__input"
                type="text"
                placeholder="Northern Michigan weekend"
                value={tripName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTripName(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="plan-trip__field">
              <span>Play date</span>
              <input
                className="plan-trip__input"
                type="date"
                value={tripDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTripDate(e.target.value)}
              />
            </label>
            <div className="plan-trip__save-row">
              <div className="plan-trip__readiness" aria-live="polite">
                <span className={selectedCourse ? 'is-ready' : ''}>Course</span>
                <span className={tripName.trim() ? 'is-ready' : ''}>Name</span>
                <span className={tripDate ? 'is-ready' : ''}>Date</span>
              </div>
              <button
                className="plan-trip__btn plan-trip__btn--save"
                type="submit"
                disabled={savingTrip || !selectedCourse}
              >
                {savingTrip ? 'Saving…' : 'Create Trip Workspace'}
              </button>
            </div>
          </form>

          {submitError && (
            <Alert
              variant="danger"
              onClose={() => setSubmitError('')}
              dismissible
              className="plan-trip__alert"
            >
              {submitError}
            </Alert>
          )}
        </section>
      </div>
    </main>
  );
};

export default PlanTrip;
