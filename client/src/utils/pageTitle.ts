// client/src/utils/pageTitle.ts
// One browser-tab title per route, built from the nav labels so a rename happens in one place.

import { getHeaderNavigation } from '../components/Header/headerNavigation';

export const APP_NAME = 'Fairway Finder';

// Routes that have no nav item of their own.
const EXTRA_LABELS: Record<string, string> = {
  '/forgot-password': 'Reset password',
};

const navLabel = (path: string): string | undefined =>
  [...getHeaderNavigation(true), ...getHeaderNavigation(false)].find((item) => item.path === path)
    ?.label;

export const pageTitle = (pathname: string): string => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/') return APP_NAME;
  // A single trip page belongs to the same section as the saved list (see isNavActive).
  const label = path.startsWith('/trip/') ? navLabel('/saved-trips') : navLabel(path) ?? EXTRA_LABELS[path];
  return `${label ?? 'Page not found'} · ${APP_NAME}`;
};
