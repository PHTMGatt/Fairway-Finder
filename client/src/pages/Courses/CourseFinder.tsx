// client/src/pages/Courses/CourseFinder.tsx

import React, { FormEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GuestDemoButton from '../../components/GuestDemoButton';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import { ADD_COURSE_TO_TRIP } from '../../utils/mutations';
import { useAuth } from '../Auth/AuthContext';
import { CourseSearchResult, toTripCourseInput } from '../Trips/planTripCourse';
import { readAddToTripId } from './courseFinderMode';
import './CourseFinder.css';

const CourseFinder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const addToTripId = isLoggedIn ? readAddToTripId(location.state) : null;
  const [city, setCity] = useState<string>('');
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [addCourseToTrip] = useMutation(ADD_COURSE_TO_TRIP);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) {
      setError('Please enter a city name.');
      setCourses([]);
      return;
    }

    setLoading(true);
    setError('');
    setCourses([]);

    try {
      const params = new URLSearchParams({ city: trimmed });
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: CourseSearchResult[] = await res.json();

      setCourses(data);
      if (data.length === 0) {
        setError(`No courses found near “${trimmed}.”`);
      }
    } catch {
      setError('Could not load courses. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const planWithCourse = (course: CourseSearchResult) => {
    navigate('/plan-trip', {
      state: {
        city: city.trim(),
        course,
      },
    });
  };

  const addCourse = async (course: CourseSearchResult) => {
    if (!addToTripId) return;

    setAddingCourseId(course.place_id);
    setError('');
    try {
      await addCourseToTrip({
        variables: {
          tripId: addToTripId,
          course: toTripCourseInput(course),
        },
      });
      navigate(`/trip/${addToTripId}`);
    } catch (addError: unknown) {
      setError(
        addError instanceof Error && addError.message
          ? addError.message
          : 'Could not add that course to the trip.'
      );
    } finally {
      setAddingCourseId(null);
    }
  };

  return (
    <main className="course-finder">
      <header className="course-finder__header">
        <p className="course-finder__eyebrow">
          {addToTripId ? 'Add to trip' : 'Course discovery'}
        </p>
        <h1 className="course-finder__title">
          {addToTripId ? 'Add another course' : 'Find a course'}
        </h1>
        <p className="course-finder__subtitle">
          {addToTripId
            ? 'Search by city and add the exact course selection to this saved trip.'
            : 'Search by city, compare nearby courses, and send the exact selection into a saved trip.'}
        </p>
      </header>

      <form className="course-finder__search" onSubmit={handleSearch}>
        <LocationAutocomplete
          value={city}
          onChange={setCity}
          placeholder="City, state"
          inputClassName="course-finder__input"
          disabled={loading || Boolean(addingCourseId)}
          ariaLabel="Course search city"
        />
        <button
          className="course-finder__btn"
          type="submit"
          disabled={loading || Boolean(addingCourseId)}
        >
          {loading ? 'Searching…' : 'Find Courses'}
        </button>
      </form>

      {addToTripId && (
        <p className="course-finder__note">
          Adding to your existing trip.{' '}
          <Link to={`/trip/${addToTripId}`}>Back to trip</Link>
        </p>
      )}

      {!isLoggedIn && (
        <p className="course-finder__note">
          Browse first, then choose a course below to continue in Guest Demo, or{' '}
          <Link to="/login">log in</Link> to save it to your account.
        </p>
      )}

      {loading && <p className="course-finder__status">Loading courses…</p>}
      {error && (
        <p className="course-finder__status course-finder__status--error" role="alert">
          {error}
        </p>
      )}

      <ul className="course-finder__results">
        {courses.map((course) => {
          const hasGooglePlaceId =
            !course.place_id.startsWith('osm-') &&
            !course.place_id.startsWith('golfcourseapi-');
          const query = [course.name, course.address]
            .filter(Boolean)
            .join(' ');
          const mapsUrl = hasGooglePlaceId
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                query
              )}&query_place_id=${encodeURIComponent(course.place_id)}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                query
              )}`;
          const planState = { city: city.trim(), course };
          const isAddingThisCourse = addingCourseId === course.place_id;

          return (
            <li key={course.place_id} className="course-card">
              <div className="course-card__body">
                <div>
                  <h2 className="course-card__name">{course.name}</h2>
                  <p className="course-card__address">{course.address}</p>
                  {course.rating !== null && (
                    <p className="course-card__rating">★ {course.rating}</p>
                  )}
                </div>

                <div className="course-card__actions">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="course-card__link"
                  >
                    Open in Maps
                  </a>
                  {addToTripId ? (
                    <button
                      type="button"
                      className="course-card__plan"
                      disabled={Boolean(addingCourseId)}
                      onClick={() => void addCourse(course)}
                    >
                      {isAddingThisCourse ? 'Adding…' : 'Add to Trip'}
                    </button>
                  ) : isLoggedIn ? (
                    <button
                      type="button"
                      className="course-card__plan"
                      onClick={() => planWithCourse(course)}
                    >
                      Plan a Trip
                    </button>
                  ) : (
                    <GuestDemoButton
                      className="course-card__plan"
                      label="Plan as Guest"
                      showNote={false}
                      destination="/plan-trip"
                      navigationState={planState}
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default CourseFinder;
