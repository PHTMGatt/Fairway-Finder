// client/src/pages/Courses/courseApi.ts
import { CourseSearchResult } from '../Trips/planTripCourse';

export const fetchCourses = async (city: string): Promise<CourseSearchResult[]> => {
  const response = await fetch(`/api/courses?${new URLSearchParams({ city }).toString()}`);
  if (!response.ok) throw new Error('Failed to fetch courses');
  return response.json();
};
