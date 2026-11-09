import { describe, expect, it } from 'vitest';
import { getGuestBannerState } from './guestBanner';
import { getHeaderNavigation, isNavActive } from './headerNavigation';

describe('guest banner state', () => {
  it('warns when a Guest Demo has less than two hours left', () => {
    const now = new Date('2026-10-23T08:00:00Z').getTime();
    const expiresAt = new Date(now + 90 * 60 * 1000);
    expect(getGuestBannerState({ isGuest: true, expiresAt }, now)).toEqual({
      expiresAt,
      warning: true,
      expired: false,
    });
  });

  it('does not show a guest banner for a permanent session', () => {
    expect(getGuestBannerState({ isGuest: false, expiresAt: new Date() }, Date.now())).toBeNull();
  });
});

describe('header navigation', () => {
  it('puts every signed-in page in the sidebar, with the two trip actions first after Dashboard', () => {
    const nav = getHeaderNavigation(true);
    expect(nav.map((item) => item.path)).toEqual([
      '/me',
      '/plan-trip',
      '/saved-trips',
      '/courses',
      '/weather',
      '/routing',
      '/handicap',
    ]);
  });

  it('keeps the phone bottom bar to at most five items', () => {
    expect(getHeaderNavigation(true).filter((item) => item.mobile)).toHaveLength(5);
    expect(getHeaderNavigation(false).filter((item) => item.mobile).length).toBeLessThanOrEqual(5);
  });

  it('shows only home and account entry points for signed-out users', () => {
    expect(getHeaderNavigation(false).map((item) => item.label)).toEqual([
      'Home',
      'Log In',
      'Invite Sign Up',
    ]);
  });

  it('marks the right item active', () => {
    expect(isNavActive('/', '/')).toBe(true);
    expect(isNavActive('/', '/me')).toBe(false);
    expect(isNavActive('/saved-trips', '/trip/abc123')).toBe(true);
    expect(isNavActive('/plan-trip', '/plan-trip')).toBe(true);
    expect(isNavActive('/plan-trip', '/saved-trips')).toBe(false);
  });
});
