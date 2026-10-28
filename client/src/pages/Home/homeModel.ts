export interface HomeAction {
  label: string;
  path: string;
}

const SIGNED_IN_PRIMARY_ACTIONS: HomeAction[] = [
  { label: 'Plan a Trip', path: '/plan-trip' },
  { label: 'My Trips', path: '/saved-trips' },
];

const SIGNED_OUT_PRIMARY_ACTIONS: HomeAction[] = [
  { label: 'Browse Courses', path: '/courses' },
  { label: 'Log In', path: '/login' },
];

const TOOLS: HomeAction[] = [
  { label: 'Course Finder', path: '/courses' },
  { label: 'Route Planner', path: '/routing' },
  { label: 'Weather', path: '/weather' },
];

export const getHomePrimaryActions = (isLoggedIn: boolean): HomeAction[] =>
  (isLoggedIn ? SIGNED_IN_PRIMARY_ACTIONS : SIGNED_OUT_PRIMARY_ACTIONS).map(
    (action) => ({ ...action })
  );

export const getHomeTools = (): HomeAction[] =>
  TOOLS.map((action) => ({ ...action }));
