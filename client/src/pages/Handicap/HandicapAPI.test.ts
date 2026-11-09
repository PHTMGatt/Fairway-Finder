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
  });

  it('accepts real GolfCourseAPI string ids', () => {
    const live = normalizeCourseDetailsResponse({ course: { ...course, id: '86gj0vqf' } });
    expect(live?.id).toBe('86gj0vqf');
  });

  it('treats a course with no tee data as empty tee lists (rating/slope are typed instead)', () => {
    const noTees = normalizeCourseDetailsResponse({ course: { ...course, tees: null } });
    expect(noTees?.tees).toEqual({ male: [], female: [] });
    const partial = normalizeCourseDetailsResponse({ course: { ...course, tees: {} } });
    expect(partial?.tees).toEqual({ male: [], female: [] });
  });
});
