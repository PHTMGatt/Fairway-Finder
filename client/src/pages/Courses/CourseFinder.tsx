// client/src/pages/Courses/CourseFinder.tsx

import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaExternalLinkAlt,
  FaFlagCheckered,
  FaMapMarkerAlt,
  FaStar,
} from 'react-icons/fa';
import GuestDemoButton from '../../components/GuestDemoButton';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import { useAuth } from '../Auth/AuthContext';
import { CourseSearchResult } from '../Trips/planTripCourse';
import {
  CourseRatingFilter,
  CourseSortMode,
  filterAndSortCourses,
} from './courseDiscovery';
import './CourseFinder.css';

const providerLabel = (placeId: string) => {
  if (placeId.startsWith('golfcourseapi-')) return 'Course directory';
  if (placeId.startsWith('osm-')) return 'OpenStreetMap';
  return 'Google Places';
};

const CourseFinder: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [city, setCity] = useState<string>('');
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [ratingFilter, setRatingFilter] = useState<CourseRatingFilter>('all');
  const [sortMode, setSortMode] = useState<CourseSortMode>('recommended');

  const visibleCourses = filterAndSortCourses(courses, ratingFilter, sortMode);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) {
      setError('Please enter a city name.');
      setCourses([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setCourses([]);
    setHasSearched(false);

    try {
      const params = new URLSearchParams({ city: trimmed });
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: CourseSearchResult[] = await res.json();

      setCourses(data);
      setHasSearched(true);
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

  const resetResultControls = () => {
    setRatingFilter('all');
    setSortMode('recommended');
  };

  return (
    <main className="course-finder">
      <header className="course-finder__hero">
        <div className="course-finder__hero-copy">
          <p className="course-finder__eyebrow">Course discovery</p>
          <h1 className="course-finder__title">Find the course that fits the trip.</h1>
          <p className="course-finder__subtitle">
            Search a city, compare nearby options, check the location, and carry the exact course straight into trip planning.
          </p>
        </div>
        <div className="course-finder__hero-flow" aria-label="Course discovery workflow">
          <span>Search</span>
          <span>Compare</span>
          <span>Route</span>
          <span>Plan</span>
        </div>
      </header>

      <section className="course-finder__search-panel" aria-labelledby="course-search-title">
        <div className="course-finder__search-heading">
          <div>
            <p className="course-finder__eyebrow">Start local</p>
            <h2 id="course-search-title">Search courses by city</h2>
          </div>
          <p>Fairway Finder keeps real provider data intact—no invented ratings or course details.</p>
        </div>

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
            Browse freely. When a course looks right, continue in Guest Demo or{' '}
            <Link to="/login">log in</Link> to keep the trip with your account.
          </p>
        )}
      </section>

      {loading && (
        <div className="course-finder__status" role="status">
          <span className="course-finder__status-dot" aria-hidden="true" />
          <div>
            <strong>Searching nearby fairways…</strong>
            <span>Checking available course providers for your city.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="course-finder__status course-finder__status--error" role="alert">
          <div>
            <strong>Course search needs another try.</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && hasSearched && courses.length === 0 && (
        <section className="course-finder__empty" aria-live="polite">
          <span className="course-finder__empty-icon" aria-hidden="true">⛳</span>
          <div>
            <h2>No courses found in that search.</h2>
            <p>Try the nearest larger city or a nearby golf destination.</p>
          </div>
        </section>
      )}

      {!loading && !error && courses.length > 0 && (
        <section className="course-finder__results-section" aria-labelledby="course-results-title">
          <div className="course-finder__toolbar">
            <div>
              <p className="course-finder__eyebrow">Nearby options</p>
              <h2 id="course-results-title">
                {visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'} ready to compare
              </h2>
              <p>{courses.length} returned by the search before your local filters.</p>
            </div>

            <div className="course-finder__controls" aria-label="Course result controls">
              <label>
                <span>Rating</span>
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value as CourseRatingFilter)}
                >
                  <option value="all">All ratings</option>
                  <option value="4-plus">4.0+ stars</option>
                  <option value="4.5-plus">4.5+ stars</option>
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as CourseSortMode)}
                >
                  <option value="recommended">Recommended order</option>
                  <option value="rating">Rating high–low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>
          </div>

          {visibleCourses.length === 0 ? (
            <div className="course-finder__filtered-empty">
              <div>
                <strong>No courses match those filters.</strong>
                <span>Reset the result controls to see every course returned by the search.</span>
              </div>
              <button type="button" onClick={resetResultControls}>Reset filters</button>
            </div>
          ) : (
            <ul className="course-finder__results">
              {visibleCourses.map((course) => {
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
                    <div className="course-card__topline">
                      <span>{providerLabel(course.place_id)}</span>
                      {typeof course.rating === 'number' ? (
                        <span className="course-card__rating" aria-label={`Rated ${course.rating} out of 5`}>
                          <FaStar aria-hidden="true" /> {course.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="course-card__rating course-card__rating--muted">Not rated</span>
                      )}
                    </div>

                    <div className="course-card__body">
                      <div className="course-card__copy">
                        <h3 className="course-card__name">{course.name}</h3>
                        <p className="course-card__address">
                          <FaMapMarkerAlt aria-hidden="true" />
                          <span>{course.address || 'Address unavailable'}</span>
                        </p>
                      </div>

                      <div className="course-card__actions">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="course-card__link"
                        >
                          <FaExternalLinkAlt aria-hidden="true" />
                          Open Map
                        </a>
                        {isLoggedIn ? (
                          <button
                            type="button"
                            className="course-card__plan"
                            onClick={() => planWithCourse(course)}
                          >
                            <FaFlagCheckered aria-hidden="true" />
                            Plan This Course
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
          )}
        </section>
      )}
    </main>
  );
};

export default CourseFinder;
