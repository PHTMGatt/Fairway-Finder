// client/src/utils/pageTitle.ts
// One browser-tab title per route, so tabs, history and screen readers can tell pages apart.

const APP_NAME = 'Fairway Finder';

const TITLES: Record<string, string> = {
  '/': APP_NAME,
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/forgot-password': 'Reset password',
  '/me': 'Dashboard',
  '/saved-trips': 'Saved trips',
  '/plan-trip': 'Plan a trip',
  '/courses': 'Find a course',
  '/routing': 'Directions',
  '/weather': 'Weather',
  '/handicap': 'Handicap',
};

export const pageTitle = (pathname: string): string => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const label = path.startsWith('/trip/') ? 'Trip details' : TITLES[path];
  if (!label) return `Page not found · ${APP_NAME}`;
  return label === APP_NAME ? APP_NAME : `${label} · ${APP_NAME}`;
};
