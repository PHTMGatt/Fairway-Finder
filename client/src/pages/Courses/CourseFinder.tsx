// src/pages/Courses/CourseFinder.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import './CourseFinder.css';

// Note; Course data structure matching API response
interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string; // Note; needed for Google Maps link
}

const CourseFinder: React.FC = () => {
  const [city, setCity] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Note; Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
  };

  // Note; Fetch golf courses from API by city
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city name.');
      setCourses([]);
      return;
    }

    setLoading(true);
    setError('');
    setCourses([]);
    try {
      const res = await fetch(`/api/courses?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: Course[] = await res.json();
      if (data.length === 0) {
        setError(`No courses found for “${city}.”`);
      } else {
        setCourses(data);
      }
    } catch {
      setError('Could not load courses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="course-finder">
      <h2 className="course-finder__title">Find Golf Courses</h2>

      {/* Note; Search form */}
      <form className="course-finder__search" onSubmit={handleSearch}>
        <input
          className="course-finder__input"
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={handleChange}
          disabled={loading}
        />
        <button
          className="btn course-finder__btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Note; Show loading or error */}
      {loading && <p className="course-finder__loading">Loading courses…</p>}
      {error && <p className="course-finder__error">{error}</p>}

      {/* Note; Display results as clickable cards */}
      <ul className="course-finder__results">
        {courses.map((course) => {
          const mapsUrl =
            `https://www.google.com/maps/search/?api=1` +
            `&query=${encodeURIComponent(course.name)}` +
            `&query_place_id=${course.place_id}`;
          return (
            <li key={course.place_id} className="course-card">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="course-card__link"
              >
                <h3 className="course-card__name">{course.name}</h3>
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
