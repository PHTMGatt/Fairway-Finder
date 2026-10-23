import { describe, expect, it } from 'vitest';
import { getLoginReasonMessage } from './loginReason';

describe('login expiry messaging', () => {
  it('explains a normal session expiry', () => {
    expect(getLoginReasonMessage('expired')).toBe('Your session expired. Please log in again.');
  });

  it('explains Guest Demo cleanup separately', () => {
    expect(getLoginReasonMessage('guest_expired')).toBe('Your Guest Demo expired. Its temporary data has been deleted.');
    expect(getLoginReasonMessage(null)).toBeNull();
  });
});
