import { describe, expect, it } from 'vitest';
import { normalizeCourseDetailsResponse } from './HandicapAPI';

const course = {
  id: 123,
  club_name: 'Example Golf Club',
  course_name: 'Championship',
  location: { address: '1 Fairway Dr' },
  tees: {
    male: [{ tee_name: 'Blue', course_rating: 72.1, slope_rating: 131 }],
    female: [],
  },
};

describe('GolfCourseAPI detail response contract', () => {
  it('accepts the direct provider payload returned by the Fairway Finder proxy', () => {
    expect(normalizeCourseDetailsResponse(course)).toEqual(course);
  });

  it('keeps compatibility with the former wrapped response shape', () => {
    expect(normalizeCourseDetailsResponse({ course })).toEqual(course);
  });

  it('rejects malformed detail payloads', () => {
    expect(normalizeCourseDetailsResponse(null)).toBeNull();
    expect(normalizeCourseDetailsResponse({ id: 123 })).toBeNull();
    expect(normalizeCourseDetailsResponse({ course: { ...course, tees: null } })).toBeNull();
  });
});
