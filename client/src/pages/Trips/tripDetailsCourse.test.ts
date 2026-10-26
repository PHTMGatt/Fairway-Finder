import { describe, expect, it } from 'vitest';
import {
  courseRemovalPrompt,
  resolveGolfCourseLookup,
  secondaryTripCourses,
  storedTeeRating,
  weatherParamsForCourse,
} from './tripDetailsCourse';

describe('Trip Details course enrichment', () => {
  it('uses an explicit GolfCourseAPI id without fuzzy searching', () => {
    expect(
      resolveGolfCourseLookup({
        name: 'Arcadia Bluffs',
        source: 'google',
        providerId: 'google-place-id',
        golfCourseApiId: '12345',
      })
    ).toEqual({ kind: 'details', id: '12345' });
  });

  it('uses a GolfCourseAPI provider id directly when that was the selected source', () => {
    expect(
      resolveGolfCourseLookup({
        name: 'Arcadia Bluffs',
        source: 'golfcourseapi',
        providerId: '98765',
      })
    ).toEqual({ kind: 'details', id: '98765' });
  });

  it('allows name search only for legacy records without provider identity', () => {
    expect(resolveGolfCourseLookup({ name: 'Legacy Links' })).toEqual({
      kind: 'search',
      query: 'Legacy Links',
    });
    expect(
      resolveGolfCourseLookup({
        name: 'Canonical Google Course',
        source: 'google',
        providerId: 'place-id',
      })
    ).toBeNull();
  });

  it('reads persisted tee rating data when both values are available', () => {
    expect(storedTeeRating({ courseRating: 72.4, slope: 131 })).toEqual({
      courseRating: 72.4,
      slopeRating: 131,
    });
    expect(storedTeeRating({ courseRating: 72.4, slope: null })).toBeNull();
  });

  it('builds weather lookup parameters from persisted course coordinates and trip date', () => {
    const course = {
      name: 'Arcadia Bluffs',
      location: { lat: 44.508, lng: -86.242 },
    };
    const params = weatherParamsForCourse(course, '2026-10-30');

    expect(params?.toString()).toBe(
      'lat=44.508&lng=-86.242&name=Arcadia+Bluffs&date=2026-10-30'
    );
    expect(weatherParamsForCourse(course, '10/30/2026')?.has('date')).toBe(false);
    expect(weatherParamsForCourse({ name: 'Legacy Links' })).toBeNull();
  });
});

describe('Trip Details secondary-course management', () => {
  it('excludes the primary course from the removable secondary-course list', () => {
    const courses = [
      { _id: 'primary', name: 'Primary Links' },
      { _id: 'second', name: 'Second Links' },
      { _id: 'third', name: 'Third Links' },
    ];

    expect(secondaryTripCourses(courses)).toEqual([courses[1], courses[2]]);
    expect(secondaryTripCourses(courses)).not.toContain(courses[0]);
  });

  it('uses a deliberate destructive confirmation message', () => {
    expect(courseRemovalPrompt('Second Links')).toBe(
      'Remove Second Links from this trip? This will not delete the trip.'
    );
  });
});
