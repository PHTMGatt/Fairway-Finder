import { describe, expect, it } from 'vitest';
import GuestDemoButton from './GuestDemoButton';
import { extractGuestToken, GUEST_DEMO_NOTE } from './GuestDemoButton.utils';

describe('Guest Demo control', () => {
  it('provides the shared Guest Demo component and accurate 24-hour cleanup copy', () => {
    expect(GuestDemoButton).toBeTypeOf('function');
    expect(GUEST_DEMO_NOTE).toBe('Temporary demo data is automatically deleted after 24 hours.');
  });

  it('extracts the guest token from the GraphQL response', () => {
    expect(extractGuestToken({ startGuestSession: { token: 'guest-token' } })).toBe('guest-token');
    expect(extractGuestToken({})).toBeNull();
  });
});
