import { describe, expect, it } from 'vitest';
import { hasGoogleMapsKey } from './mapCapability';

describe('Google Maps client capability', () => {
  it('treats a non-empty key as available', () => {
    expect(hasGoogleMapsKey('maps-key')).toBe(true);
    expect(hasGoogleMapsKey('  maps-key  ')).toBe(true);
  });

  it('allows the rest of the app to run when the key is absent', () => {
    expect(hasGoogleMapsKey(undefined)).toBe(false);
    expect(hasGoogleMapsKey('')).toBe(false);
    expect(hasGoogleMapsKey('   ')).toBe(false);
  });
});
