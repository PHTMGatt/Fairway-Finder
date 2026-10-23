import { describe, expect, it } from 'vitest';
import Auth from './auth';

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const tokenWith = (data: object, exp: number) =>
  `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ data, exp })}.signature`;

describe('guest session token metadata', () => {
  it('identifies a guest token and exposes its expiry', () => {
    const exp = 1_900_000_000;
    const token = tokenWith(
      { _id: 'guest-id', username: 'guest-abc', email: 'abc@guest.invalid', isGuest: true },
      exp
    );

    const info = (Auth as any).getSessionInfoFromToken(token);

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

    const info = (Auth as any).getSessionInfoFromToken(token);

    expect(info).toEqual({
      isGuest: false,
      expiresAt: new Date(exp * 1000),
    });
  });

  it('returns null for malformed tokens', () => {
    expect((Auth as any).getSessionInfoFromToken('not-a-token')).toBeNull();
  });
});
