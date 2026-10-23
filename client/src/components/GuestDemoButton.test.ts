import { describe, expect, it } from 'vitest';

const guestModules = import.meta.glob('./GuestDemoButton.tsx', { eager: true });

describe('Guest Demo control', () => {
  it('provides the shared Guest Demo component and 24-hour cleanup copy', () => {
    const module = guestModules['./GuestDemoButton.tsx'] as Record<string, unknown> | undefined;
    expect(module).toBeDefined();
    expect(module?.default).toBeTypeOf('function');
    expect(module?.GUEST_DEMO_NOTE).toBe('Stays on this device and is deleted after 24 hours.');
  });

  it('extracts the guest token from the GraphQL response', () => {
    const module = guestModules['./GuestDemoButton.tsx'] as Record<string, any> | undefined;
    expect(module).toBeDefined();
    const extractGuestToken = module?.extractGuestToken;
    expect(extractGuestToken).toBeTypeOf('function');
    expect(extractGuestToken({ startGuestSession: { token: 'guest-token' } })).toBe('guest-token');
    expect(extractGuestToken({})).toBeNull();
  });
});
