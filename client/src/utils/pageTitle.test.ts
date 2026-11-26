import { describe, expect, it } from 'vitest';
import { pageTitle } from './pageTitle';

describe('pageTitle', () => {
  it('uses the bare app name on home', () => {
    expect(pageTitle('/')).toBe('Fairway Finder');
  });

  it('names each main route', () => {
    expect(pageTitle('/courses')).toBe('Find a course · Fairway Finder');
    expect(pageTitle('/weather')).toBe('Weather · Fairway Finder');
    expect(pageTitle('/login')).toBe('Log in · Fairway Finder');
  });

  it('ignores a trailing slash', () => {
    expect(pageTitle('/saved-trips/')).toBe('Saved trips · Fairway Finder');
  });

  it('labels any trip id as trip details', () => {
    expect(pageTitle('/trip/abc123')).toBe('Trip details · Fairway Finder');
  });

  it('flags unknown paths', () => {
    expect(pageTitle('/nope')).toBe('Page not found · Fairway Finder');
  });
});
