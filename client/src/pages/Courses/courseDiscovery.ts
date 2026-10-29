import { CourseSearchResult } from '../Trips/planTripCourse';

export type CourseRatingFilter = 'all' | '4-plus' | '4.5-plus';
export type CourseSortMode = 'recommended' | 'rating' | 'name';

const minimumRating: Record<CourseRatingFilter, number | null> = {
  all: null,
  '4-plus': 4,
  '4.5-plus': 4.5,
};

export const filterAndSortCourses = (
  courses: CourseSearchResult[],
  ratingFilter: CourseRatingFilter,
  sortMode: CourseSortMode
): CourseSearchResult[] => {
  const threshold = minimumRating[ratingFilter];
  const filtered = threshold === null
    ? [...courses]
    : courses.filter(
        (course) => typeof course.rating === 'number' && course.rating >= threshold
      );

  if (sortMode === 'recommended') return filtered;

  return filtered.sort((a, b) => {
    if (sortMode === 'name') {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }

    if (a.rating === null && b.rating === null) return 0;
    if (a.rating === null) return 1;
    if (b.rating === null) return -1;
    return b.rating - a.rating;
  });
};
