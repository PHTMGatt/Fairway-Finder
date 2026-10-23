import { describe, expect, it } from 'vitest';
import * as LoginModule from './Login';

describe('login expiry messaging', () => {
  it('explains a normal session expiry', () => {
    const messageFor = (LoginModule as any).getLoginReasonMessage;
    expect(messageFor).toBeDefined();
    expect(messageFor('expired')).toBe('Your session expired. Please log in again.');
  });

  it('explains Guest Demo cleanup separately', () => {
    const messageFor = (LoginModule as any).getLoginReasonMessage;
    expect(messageFor).toBeDefined();
    expect(messageFor('guest_expired')).toBe('Your Guest Demo expired. Its temporary data has been deleted.');
    expect(messageFor(null)).toBeNull();
  });
});
