import { describe, expect, it } from 'vitest';
import { readRoutePlannerPrefill } from './routePlanner';

describe('route planner prefill', () => {
  it('accepts a saved-trip destination without auto-submitting', () => {
    expect(
      readRoutePlannerPrefill({
        destination: 'Arcadia Bluffs Golf Club, Arcadia, MI',
      })
    ).toEqual({
      origin: '',
      destination: 'Arcadia Bluffs Golf Club, Arcadia, MI',
      submitted: false,
    });
  });

  it('ignores malformed navigation state', () => {
    expect(readRoutePlannerPrefill(null)).toEqual({
      origin: '',
      destination: '',
      submitted: false,
    });
    expect(readRoutePlannerPrefill({ origin: 42, destination: [] })).toEqual({
      origin: '',
      destination: '',
      submitted: false,
    });
  });
});
