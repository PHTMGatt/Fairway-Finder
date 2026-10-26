import { describe, expect, it } from 'vitest';
import { readPlanTripPrefill } from './planTripCourse';

const course = {
  name: 'Arcadia Bluffs Golf Club',
  address: '14710 Northwood Hwy, Arcadia, MI 49613',
  rating: 4.8,
  place_id: 'ChIJ-google-place',
  location: { lat: 44.508, lng: -86.242 },
};

describe('Plan Trip course prefill', () => {
  it('accepts a course selected from Course Finder', () => {
    expect(readPlanTripPrefill({ city: 'Arcadia, MI', course })).toEqual({
      city: 'Arcadia, MI',
      course,
    });
  });

  it('rejects malformed navigation state instead of trusting it', () => {
    expect(readPlanTripPrefill(null)).toEqual({ city: '', course: null });
    expect(readPlanTripPrefill({ city: 42, course: { name: 'Missing identity' } })).toEqual({
      city: '',
      course: null,
    });
  });
});
