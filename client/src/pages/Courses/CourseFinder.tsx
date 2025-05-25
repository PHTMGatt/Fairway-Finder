// src/pages/Courses/CourseFinder.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import './CourseFinder.css';

interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
}

const CourseFinder: React.FC = () => {
  const [city, setCity] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCityChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
  };

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
      const params = new URLSearchParams({ city: city.trim() });
      const res = await fetch(`http://localhost:3001/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: Course[] = await res.json();
      setCourses(data.length ? data : []);
      if (!data.length) setError(`No courses found for “${city}.”`);
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
        <p className="course-finder__subtitle">Search by city and explore nearby greens ⛳</p>
      </div>

      <form className="course-finder__search" onSubmit={handleSearch}>
        <input
          className="course-finder__input"
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={handleCityChange}
          disabled={loading}
        />
        <button className="course-finder__btn" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {loading && <p className="course-finder__loading">Loading courses…</p>}
      {error && <p className="course-finder__error">{error}</p>}

      <ul className="course-finder__results">
        {courses.map((course) => {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(course.name)}&query_place_id=${course.place_id}`;
          return (
            <li key={course.place_id} className="course-card">
              <div className="course-card__banner">
                <h3 className="course-card__name">{course.name}</h3>
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="course-card__link">
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
