import { describe, expect, it } from 'vitest';
import { CourseSearchResult } from '../Trips/planTripCourse';
import { filterAndSortCourses } from './courseDiscovery';

const course = (
  name: string,
  rating: number | null,
  placeId: string
): CourseSearchResult => ({
  name,
  rating,
  place_id: placeId,
  address: `${name} address`,
  location: null,
});

const courses = [
  course('Pine Ridge', 4.2, 'pine'),
  course('Majestic Links', 4.8, 'majestic'),
  course('Hidden Valley', null, 'hidden'),
  course('Grand Oaks', 4.5, 'grand'),
];

describe('filterAndSortCourses', () => {
  it('keeps unrated courses in the default recommended view and preserves API order', () => {
    const result = filterAndSortCourses(courses, 'all', 'recommended');

    expect(result.map((item) => item.place_id)).toEqual([
      'pine',
      'majestic',
      'hidden',
      'grand',
    ]);
  });

  it('filters to courses rated 4.0 or better', () => {
    const result = filterAndSortCourses(courses, '4-plus', 'recommended');

    expect(result.map((item) => item.place_id)).toEqual(['pine', 'majestic', 'grand']);
  });

  it('filters to courses rated 4.5 or better', () => {
    const result = filterAndSortCourses(courses, '4.5-plus', 'recommended');

    expect(result.map((item) => item.place_id)).toEqual(['majestic', 'grand']);
  });

  it('sorts rated courses high to low and leaves unrated courses last', () => {
    const result = filterAndSortCourses(courses, 'all', 'rating');

    expect(result.map((item) => item.place_id)).toEqual([
      'majestic',
      'grand',
      'pine',
      'hidden',
    ]);
  });

  it('sorts course names alphabetically', () => {
    const result = filterAndSortCourses(courses, 'all', 'name');

    expect(result.map((item) => item.name)).toEqual([
      'Grand Oaks',
      'Hidden Valley',
      'Majestic Links',
      'Pine Ridge',
    ]);
  });
});
