import { print } from 'graphql';
import { describe, expect, it } from 'vitest';
import * as mutations from './mutations';
import { QUERY_ME, QUERY_MY_TRIPS } from './queries';

describe('guest GraphQL client operations', () => {
  it('defines the startGuestSession mutation with temporary profile metadata', () => {
    const document = (mutations as any).START_GUEST_SESSION;
    expect(document).toBeDefined();

    const source = print(document);
    expect(source).toContain('startGuestSession');
    expect(source).toContain('token');
    expect(source).toContain('isGuest');
    expect(source).toContain('expiresAt');
  });

  it('requests guest metadata on current-profile queries', () => {
    for (const document of [QUERY_ME, QUERY_MY_TRIPS]) {
      const source = print(document);
      expect(source).toContain('isGuest');
      expect(source).toContain('expiresAt');
    }
  });
});
