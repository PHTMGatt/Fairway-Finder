export type FooterBackTarget = -1 | '/';

/**
 * React Router gives a directly loaded browser entry the key "default".
 * In that case browser-back may leave Fairway Finder, so recover to Home instead.
 */
export const getFooterBackTarget = (locationKey?: string): FooterBackTarget =>
  locationKey && locationKey !== 'default' ? -1 : '/';
