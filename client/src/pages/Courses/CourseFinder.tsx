// client/src/pages/Courses/CourseFinder.tsx

import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GuestDemoButton from '../../components/GuestDemoButton';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import { useAuth } from '../Auth/AuthContext';
import { CourseSearchResult } from '../Trips/planTripCourse';
import './CourseFinder.css';

const CourseFinder: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [city, setCity] = useState<string>('');
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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

  return (
    <main className="course-finder">
      <header className="course-finder__header">
        <p className="course-finder__eyebrow">Course discovery</p>
        <h1 className="course-finder__title">Find a course</h1>
        <p className="course-finder__subtitle">
          Search by city, compare nearby courses, and send the exact selection into a saved trip.
        </p>
      </header>

      <form className="course-finder__search" onSubmit={handleSearch}>
        <LocationAutocomplete
          value={city}
          onChange={setCity}
          placeholder="City, state"
          inputClassName="course-finder__input"
          disabled={loading}
          ariaLabel="Course search city"
        />
        <button
          className="course-finder__btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Find Courses'}
        </button>
      </form>

      {!isLoggedIn && (
        <p className="course-finder__note">
          Browse first, then choose a course below to continue in Guest Demo, or{' '}
          <Link to="/login">log in</Link> to save it to your account.
        </p>
      )}

      {loading && <p className="course-finder__status">Loading courses…</p>}
      {error && <p className="course-finder__status course-finder__status--error">{error}</p>}

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
                  {isLoggedIn ? (
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
