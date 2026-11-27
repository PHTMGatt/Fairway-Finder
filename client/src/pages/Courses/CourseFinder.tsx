// client/src/pages/Courses/CourseFinder.tsx

import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaExternalLinkAlt,
  FaFlagCheckered,
  FaMapMarkerAlt,
  FaStar,
} from 'react-icons/fa';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import Notice from '../../components/ui/Notice';
import { Button, Field, PageHeader, Panel } from '../../components/ui/primitives';
import { useAuth } from '../Auth/AuthContext';
import { CourseSearchResult } from '../Trips/planTripCourse';
import { useCourseSearch } from './useCourseSearch';
import { useStartRound } from './useStartRound';
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
  const { courses, loading, error, searchedCity, search } = useCourseSearch();
  const hasSearched = searchedCity !== '';
  const [ratingFilter, setRatingFilter] = useState<CourseRatingFilter>('all');
  const [sortMode, setSortMode] = useState<CourseSortMode>('recommended');

  const visibleCourses = filterAndSortCourses(courses, ratingFilter, sortMode);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void search(city);
  };

  const { startRound, startingId, error: startError } = useStartRound();

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
      <PageHeader title="Find a course" />

      <Panel aria-label="Search courses by city">
        <form className="course-finder__search" onSubmit={handleSearch}>
          <Field label="Course search city" hideLabel>
            {({ id }) => (
              <LocationAutocomplete
                id={id}
                value={city}
                onChange={setCity}
                placeholder="City, state"
                inputClassName="ff-input"
                disabled={loading}
              />
            )}
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Find Courses'}
          </Button>
        </form>

        {!isLoggedIn && (
          <p className="course-finder__note">
            Browse freely. When a course looks right, continue in Guest Demo or{' '}
            <Link to="/login">log in</Link> to keep the trip with your account.
          </p>
        )}
      </Panel>

      {loading && <Notice>Searching nearby fairways…</Notice>}

      {error && <Notice tone="danger">{error}</Notice>}

      {!loading && !error && hasSearched && courses.length === 0 && (
        <Panel className="course-finder__empty" aria-live="polite">
          <span className="course-finder__empty-icon" aria-hidden="true">⛳</span>
          <div>
            <h2>No courses found in that search.</h2>
            <p>Try the nearest larger city or a nearby golf destination.</p>
          </div>
        </Panel>
      )}

      {!loading && !error && courses.length > 0 && (
        <section className="course-finder__results-section" aria-labelledby="course-results-title">
          <div className="course-finder__toolbar">
            <h2 id="course-results-title">
              {visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'}
            </h2>

            <div className="course-finder__controls" aria-label="Course result controls">
              <Field label="Rating">
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value as CourseRatingFilter)}
                >
                  <option value="all">All ratings</option>
                  <option value="4-plus">4.0+ stars</option>
                  <option value="4.5-plus">4.5+ stars</option>
                </select>
              </Field>
              <Field label="Sort">
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as CourseSortMode)}
                >
                  <option value="recommended">Recommended order</option>
                  <option value="rating">Rating high–low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </Field>
            </div>
          </div>

          {startError && <Notice tone="danger">{startError}</Notice>}

          {visibleCourses.length === 0 ? (
            <div className="course-finder__filtered-empty">
              <div>
                <strong>No courses match those filters.</strong>
                <span>Clear the filters to see all courses.</span>
              </div>
              <Button variant="secondary" onClick={resetResultControls}>Reset filters</Button>
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
                        <Button
                          variant="secondary"
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          icon={<FaExternalLinkAlt />}
                        >
                          Open Map
                        </Button>
                        <Button
                          onClick={() => void startRound(course)}
                          disabled={startingId !== null}
                          icon={<FaFlagCheckered />}
                        >
                          {startingId === (course.place_id || course.name) ? 'Starting…' : 'Play here today'}
                        </Button>
                        {isLoggedIn && (
                          <Button variant="secondary" onClick={() => planWithCourse(course)}>
                            Plan for later
                          </Button>
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
