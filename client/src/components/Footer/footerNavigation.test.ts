import { describe, expect, it } from 'vitest';
import { getFooterBackTarget } from './footerNavigation';

describe('footer back navigation', () => {
  it('sends a directly loaded route home instead of leaving Fairway Finder', () => {
    expect(getFooterBackTarget('default')).toBe('/');
    expect(getFooterBackTarget(undefined)).toBe('/');
  });

  it('uses browser back after an in-app navigation created the current entry', () => {
    expect(getFooterBackTarget('router-entry-123')).toBe(-1);
  });
});
