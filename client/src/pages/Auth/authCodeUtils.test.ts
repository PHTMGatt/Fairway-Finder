import { describe, expect, it } from 'vitest';
import { cleanCode, errorText } from './authCodeUtils';

describe('email code helpers', () => {
  it('keeps only six digits from pasted text', () => {
    expect(cleanCode('Code: 123 456')).toBe('123456');
    expect(cleanCode('12345678')).toBe('123456');
    expect(cleanCode('abc')).toBe('');
  });

  it('prefers the server message', () => {
    expect(errorText({ graphQLErrors: [{ message: 'That code expired.' }] }, 'x')).toBe('That code expired.');
    expect(errorText(new Error('boom'), 'x')).toBe('boom');
    expect(errorText(null, 'fallback')).toBe('fallback');
  });
});
