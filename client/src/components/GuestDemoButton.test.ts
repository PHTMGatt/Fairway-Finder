import { describe, expect, it } from 'vitest';
import GuestDemoButton from './GuestDemoButton';
import {
  extractGuestToken,
  GUEST_DEMO_NOTE,
  getGuestDemoNavigation,
} from './GuestDemoButton.utils';

describe('Guest Demo control', () => {
  it('provides the shared Guest Demo component and explains isolated 24-hour data', () => {
    expect(GuestDemoButton).toBeTypeOf('function');
    expect(GUEST_DEMO_NOTE).toBe(
      'Your isolated demo data is automatically deleted after 24 hours.'
    );
  });

  it('extracts the guest token from the GraphQL response', () => {
    expect(extractGuestToken({ startGuestSession: { token: 'guest-token' } })).toBe('guest-token');
    expect(extractGuestToken({})).toBeNull();
  });

  it('lands a new demo session on seeded My Trips and preserves explicit destinations', () => {
    expect(getGuestDemoNavigation()).toEqual({
      destination: '/saved-trips',
      options: { replace: true },
    });

    const courseState = { city: 'Gaylord, MI', course: { name: 'Treetops' } };
    expect(getGuestDemoNavigation('/plan-trip', courseState)).toEqual({
      destination: '/plan-trip',
      options: { replace: true, state: courseState },
    });
  });
});
