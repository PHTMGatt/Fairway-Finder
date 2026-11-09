export interface HomeAction {
  label: string;
  path: string;
}

// One obvious first step: pick a course and play. No account needed.
const SIGNED_IN_PRIMARY_ACTIONS: HomeAction[] = [
  { label: 'Start a Round', path: '/courses' },
  { label: 'My Rounds', path: '/saved-trips' },
];

const SIGNED_OUT_PRIMARY_ACTIONS: HomeAction[] = [
  { label: 'Start a Round', path: '/courses' },
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
