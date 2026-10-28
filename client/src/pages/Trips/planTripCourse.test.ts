import { describe, expect, it } from 'vitest';
import { toTripCourseInput } from './planTripCourse';

describe('Plan Trip course normalization', () => {
  it('maps a Google Places result to canonical TripCourse input', () => {
    expect(
      toTripCourseInput({
        name: 'Arcadia Bluffs Golf Club',
        address: '14710 Northwood Hwy, Arcadia, MI 49613',
        rating: 4.8,
        place_id: 'ChIJ-google-place',
        location: { lat: 44.508, lng: -86.242 },
      })
    ).toEqual({
      name: 'Arcadia Bluffs Golf Club',
      source: 'google',
      providerId: 'ChIJ-google-place',
      address: '14710 Northwood Hwy, Arcadia, MI 49613',
      rating: 4.8,
      location: { lat: 44.508, lng: -86.242 },
    });
  });

  it('extracts the native GolfCourseAPI id from its discovery id', () => {
    expect(
      toTripCourseInput({
        name: 'Example Club — Championship',
        address: 'Detroit, MI',
        rating: null,
        place_id: 'golfcourseapi-12345',
        location: null,
      })
    ).toEqual({
      name: 'Example Club — Championship',
      source: 'golfcourseapi',
      providerId: '12345',
      golfCourseApiId: '12345',
      address: 'Detroit, MI',
    });
  });

  it('preserves the OSM synthetic id as the provider identity', () => {
    expect(
      toTripCourseInput({
        name: 'Community Golf Course',
        address: 'Address N/A',
        rating: null,
        place_id: 'osm-way-98765',
        location: { lat: 42.3, lng: -83.7 },
      })
    ).toEqual({
      name: 'Community Golf Course',
      source: 'osm',
      providerId: 'osm-way-98765',
      location: { lat: 42.3, lng: -83.7 },
    });
  });

  it('omits unavailable optional metadata cleanly', () => {
    expect(
      toTripCourseInput({
        name: 'Minimal Course',
        address: '',
        rating: null,
        place_id: '',
        location: null,
      })
    ).toEqual({ name: 'Minimal Course' });
  });
});
