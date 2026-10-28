import { describe, expect, it } from 'vitest';
import Auth from './auth';

const encode = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const tokenWith = (data: object, exp: number) =>
  `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ data, exp })}.signature`;

describe('guest session token metadata', () => {
  it('identifies a guest token and exposes its expiry', () => {
    const exp = 1_900_000_000;
    const token = tokenWith(
      { _id: 'guest-id', username: 'guest-abc', email: 'abc@guest.invalid', isGuest: true },
      exp
    );

    const info = Auth.getSessionInfoFromToken(token);

    expect(info).toEqual({
      isGuest: true,
      expiresAt: new Date(exp * 1000),
    });
  });

  it('treats a permanent token as non-guest while preserving expiry', () => {
    const exp = 1_900_000_100;
    const token = tokenWith(
      { _id: 'user-id', username: 'player', email: 'player@example.com' },
      exp
    );

    const info = Auth.getSessionInfoFromToken(token);

    expect(info).toEqual({
      isGuest: false,
      expiresAt: new Date(exp * 1000),
    });
  });

  it('returns null for malformed tokens', () => {
    expect(Auth.getSessionInfoFromToken('not-a-token')).toBeNull();
  });

  it('chooses a guest-expired redirect reason for guest tokens', () => {
    const token = tokenWith(
      { _id: 'guest-id', username: 'guest-abc', email: 'abc@guest.invalid', isGuest: true },
      1_900_000_000
    );

    expect((Auth as any).getExpiredReasonFromToken(token)).toBe('guest_expired');
  });

  it('chooses a normal expired redirect reason for permanent or malformed tokens', () => {
    const permanent = tokenWith(
      { _id: 'user-id', username: 'player', email: 'player@example.com' },
      1_900_000_100
    );

    expect((Auth as any).getExpiredReasonFromToken(permanent)).toBe('expired');
    expect((Auth as any).getExpiredReasonFromToken('broken')).toBe('expired');
  });
});
