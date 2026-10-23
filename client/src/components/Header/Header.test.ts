import { describe, expect, it } from 'vitest';
import { getGuestBannerState } from './guestBanner';

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
