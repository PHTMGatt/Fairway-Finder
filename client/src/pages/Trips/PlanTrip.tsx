// client/src/pages/Trips/PlanTrip.tsx
import React, { useState, FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { useMutation } from '@apollo/client';
import { ADD_TRIP } from '../../utils/mutations';
import { QUERY_TRIPS } from '../../utils/queries';
import Notice from '../../components/ui/Notice';
import { Button, Field, ListRow, PageHeader, Panel } from '../../components/ui/primitives';
import { FaStar } from 'react-icons/fa';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import { useCourseSearch } from '../Courses/useCourseSearch';
import {
  CourseSearchResult,
  readPlanTripPrefill,
  toTripCourseInput,
} from './planTripCourse';
import './PlanTrip.css';

const rating = (course: CourseSearchResult) =>
  typeof course.rating === 'number' ? (
    <span className="plan-trip__rating" aria-label={`Rated ${course.rating} out of 5`}>
      <FaStar aria-hidden="true" /> {course.rating.toFixed(1)}
    </span>
  ) : undefined;

const PlanTrip: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [prefill] = useState(() => readPlanTripPrefill(location.state));

  const [searchCity, setSearchCity] = useState<string>(prefill.city);
  const {
    courses: courseOptions,
    loading: courseLoading,
    error: searchError,
    searchedCity,
    search,
    dismissMessage,
  } = useCourseSearch();
  const courseError =
    searchError ||
    (searchedCity && !courseOptions.length ? `No courses found near “${searchedCity}.”` : '');
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

  const handleCourseSearch = (e: FormEvent) => {
    e.preventDefault();
    setSelectedCourse(null);
    void search(searchCity);
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
      <PageHeader title="Plan Ahead" className="plan-trip__header" />

      <Panel title="Course">
        <form className="plan-trip__search" onSubmit={handleCourseSearch}>
          <Field label="Trip course city" hideLabel>
            {({ id }) => (
              <LocationAutocomplete
                id={id}
                value={searchCity}
                onChange={setSearchCity}
                placeholder="City, state"
                inputClassName="ff-input"
                disabled={courseLoading}
              />
            )}
          </Field>
          <Button type="submit" variant="secondary" disabled={courseLoading}>
            {courseLoading ? 'Searching…' : 'Find Courses'}
          </Button>
        </form>

        {courseError && (
          <Notice tone="danger" onClose={dismissMessage} className="plan-trip__alert">
            {courseError}
          </Notice>
        )}

        {courseOptions.length > 0 && (
          <ul className="plan-trip__results" aria-label="Course search results">
            {courseOptions.map((course) => (
              <li key={course.place_id}>
                <ListRow
                  title={course.name}
                  meta={course.address || 'Address unavailable'}
                  trailing={rating(course)}
                  onClick={() => setSelectedCourse(course)}
                  pressed={selectedCourse?.place_id === course.place_id}
                  chevron={false}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Details">
        <div className="plan-trip__selection" role="status">
          {selectedCourse ? (
            <>
              <strong>{selectedCourse.name}</strong>
              {selectedCourse.address && <span>{selectedCourse.address}</span>}
            </>
          ) : (
            <span>Pick a course first.</span>
          )}
        </div>

        <form className="plan-trip__details" onSubmit={handleTripSave}>
          <Field label="Trip name">
            <input
              type="text"
              placeholder="Northern Michigan weekend"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Play date">
            <input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
          </Field>
          <Button type="submit" block disabled={savingTrip || !selectedCourse}>
            {savingTrip ? 'Saving…' : 'Create Trip'}
          </Button>
        </form>

        {submitError && (
          <Notice tone="danger" onClose={() => setSubmitError('')} className="plan-trip__alert">
            {submitError}
          </Notice>
        )}
      </Panel>
    </main>
  );
};

export default PlanTrip;
