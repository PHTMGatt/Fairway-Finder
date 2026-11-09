export type NavIcon =
  | 'home'
  | 'plan'
  | 'trips'
  | 'courses'
  | 'weather'
  | 'routes'
  | 'handicap'
  | 'login'
  | 'signup';

export interface HeaderNavigationItem {
  label: string;
  path: string;
  icon: NavIcon;
  /** Shown in the phone bottom bar (max five). Every item shows in the desktop sidebar. */
  mobile?: boolean;
}

const SIGNED_IN: HeaderNavigationItem[] = [
  { label: 'Dashboard', path: '/me', icon: 'home', mobile: true },
  { label: 'Plan Trip', path: '/plan-trip', icon: 'plan', mobile: true },
  { label: 'My Trips', path: '/saved-trips', icon: 'trips', mobile: true },
  { label: 'Courses', path: '/courses', icon: 'courses', mobile: true },
  { label: 'Weather', path: '/weather', icon: 'weather' },
  { label: 'Routes', path: '/routing', icon: 'routes' },
  { label: 'Handicap', path: '/handicap', icon: 'handicap', mobile: true },
];

const SIGNED_OUT: HeaderNavigationItem[] = [
  { label: 'Home', path: '/', icon: 'home', mobile: true },
  { label: 'Log In', path: '/login', icon: 'login', mobile: true },
  { label: 'Invite Sign Up', path: '/signup', icon: 'signup', mobile: true },
];

export const getHeaderNavigation = (isLoggedIn: boolean): HeaderNavigationItem[] =>
  isLoggedIn ? SIGNED_IN : SIGNED_OUT;

/** True when `pathname` belongs to the nav item ("/" is exact; trip pages count as My Trips). */
export const isNavActive = (itemPath: string, pathname: string): boolean => {
  if (itemPath === '/') return pathname === '/';
  if (itemPath === '/saved-trips') return pathname === itemPath || pathname.startsWith('/trip/');
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};
