import { describe, expect, it } from 'vitest';
import { getHomePrimaryActions, getHomeTools } from './homeModel';

describe('Home information hierarchy', () => {
  it('makes "Start a Round" (pick a course) the first action for everyone', () => {
    expect(getHomePrimaryActions(true)).toEqual([
      { label: 'Start a Round', path: '/courses' },
      { label: 'My Rounds', path: '/saved-trips' },
    ]);
    expect(getHomePrimaryActions(false)).toEqual([
      { label: 'Start a Round', path: '/courses' },
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
