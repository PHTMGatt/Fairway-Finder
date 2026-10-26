import { describe, expect, it } from 'vitest';
import { readAddToTripId } from './courseFinderMode';

describe('Course Finder add-to-trip mode', () => {
  it('reads a trimmed explicit trip target from route state', () => {
    expect(readAddToTripId({ addToTripId: '  trip-123  ' })).toBe('trip-123');
  });

  it('ignores missing, empty, and non-string targets', () => {
    expect(readAddToTripId(undefined)).toBeNull();
    expect(readAddToTripId(null)).toBeNull();
    expect(readAddToTripId({})).toBeNull();
    expect(readAddToTripId({ addToTripId: '   ' })).toBeNull();
    expect(readAddToTripId({ addToTripId: 42 })).toBeNull();
  });
});
