import { describe, expect, it } from 'vitest';
import { resolveGolfCourseLookup, storedTeeRating } from './tripDetailsCourse';

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
});
