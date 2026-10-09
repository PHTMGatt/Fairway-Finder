// src/pages/Courses/CourseFinder.tsx

import React, { FormEvent, useState } from 'react';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import './CourseFinder.css';

interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
}

const CourseFinder: React.FC = () => {
  const [city, setCity] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
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
      const data: Course[] = await res.json();

      setCourses(data);
      if (data.length === 0) {
        setError(`No courses found near “${trimmed}.”`);
      }
    } catch {
      setError('Could not load courses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="course-finder">
      <div className="course-finder__banner">
        <h2 className="course-finder__title">Find the Best Golf Courses</h2>
        <p className="course-finder__subtitle">
          Search by city and explore nearby greens ⛳
        </p>
      </div>

      <form className="course-finder__search" onSubmit={handleSearch}>
        <LocationAutocomplete
          value={city}
          onChange={setCity}
          placeholder="Enter city"
          inputClassName="course-finder__input"
          disabled={loading}
          ariaLabel="Course search city"
        />
        <button
          className="course-finder__btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {loading && <p className="course-finder__loading">Loading courses…</p>}
      {error && <p className="course-finder__error">{error}</p>}

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

          return (
            <li key={course.place_id} className="course-card">
              <div className="course-card__banner">
                <h3 className="course-card__name">{course.name}</h3>
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="course-card__link"
              >
                <p className="course-card__address">{course.address}</p>
                {course.rating !== null && (
                  <p className="course-card__rating">⭐ {course.rating}</p>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default CourseFinder;
