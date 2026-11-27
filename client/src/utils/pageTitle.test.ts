import { describe, expect, it } from 'vitest';
import { getHeaderNavigation } from '../components/Header/headerNavigation';
import { APP_NAME, pageTitle } from './pageTitle';

const label = (path: string) =>
  [...getHeaderNavigation(true), ...getHeaderNavigation(false)].find((item) => item.path === path)!
    .label;

describe('pageTitle', () => {
  it('uses the bare app name on home', () => {
    expect(pageTitle('/')).toBe(APP_NAME);
  });

  it('matches the nav label for every nav route', () => {
    for (const item of [...getHeaderNavigation(true), ...getHeaderNavigation(false)]) {
      if (item.path === '/') continue;
      expect(pageTitle(item.path)).toBe(`${item.label} · ${APP_NAME}`);
    }
  });

  it('ignores a trailing slash', () => {
    expect(pageTitle('/courses/')).toBe(pageTitle('/courses'));
  });

  it('puts a single trip page under the saved-list section', () => {
    expect(pageTitle('/trip/abc123')).toBe(`${label('/saved-trips')} · ${APP_NAME}`);
  });

  it('names routes without a nav item and flags unknown paths', () => {
    expect(pageTitle('/forgot-password')).not.toContain('Page not found');
    expect(pageTitle('/nope')).toBe(`Page not found · ${APP_NAME}`);
  });
});
