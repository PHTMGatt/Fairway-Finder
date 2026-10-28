import { describe, expect, it } from 'vitest';
import { getHomePrimaryActions, getHomeTools } from './homeModel';

describe('Home information hierarchy', () => {
  it('puts the trip workflow first for signed-in users', () => {
    expect(getHomePrimaryActions(true)).toEqual([
      { label: 'Plan a Trip', path: '/plan-trip' },
      { label: 'My Trips', path: '/saved-trips' },
    ]);
  });

  it('lets signed-out visitors browse before asking them to authenticate', () => {
    expect(getHomePrimaryActions(false)).toEqual([
      { label: 'Browse Courses', path: '/courses' },
      { label: 'Log In', path: '/login' },
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
