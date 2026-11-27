// client/src/pages/Courses/useCourseSearch.ts
// City course search state, shared by Course Finder and Plan Ahead.
import { useState } from 'react';
import { CourseSearchResult } from '../Trips/planTripCourse';
import { fetchCourses } from './courseApi';

export const useCourseSearch = () => {
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  /** City of the last search that succeeded; '' before one and while searching. */
  const [searchedCity, setSearchedCity] = useState('');

  const search = async (rawCity: string) => {
    const city = rawCity.trim();
    setCourses([]);
    setError('');
    setSearchedCity('');
    if (!city) {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);
    try {
      setCourses(await fetchCourses(city));
      setSearchedCity(city);
    } catch {
      setError('Could not load courses. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  /** Clears an error or "nothing found" message. */
  const dismissMessage = () => {
    setError('');
    setSearchedCity('');
  };

  return { courses, loading, error, searchedCity, search, dismissMessage };
};
