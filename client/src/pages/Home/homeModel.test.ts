import { describe, expect, it } from 'vitest';
import { getHomePrimaryActions, getHomeTools } from './homeModel';

describe('Home information hierarchy', () => {
  it('puts the trip workflow first', () => {
    expect(getHomePrimaryActions()).toEqual([
      { label: 'Plan a Trip', path: '/plan-trip' },
      { label: 'My Trips', path: '/saved-trips' },
    ]);
  });

  it('keeps standalone utilities secondary', () => {
    expect(getHomeTools()).toEqual([
      { label: 'Course Finder', path: '/courses' },
      { label: 'Route Planner', path: '/routing' },
      { label: 'Weather', path: '/weather' },
    ]);
  });
});
