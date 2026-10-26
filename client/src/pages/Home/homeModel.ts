export interface HomeAction {
  label: string;
  path: string;
}

const PRIMARY_ACTIONS: HomeAction[] = [
  { label: 'Plan a Trip', path: '/plan-trip' },
  { label: 'My Trips', path: '/saved-trips' },
];

const TOOLS: HomeAction[] = [
  { label: 'Course Finder', path: '/courses' },
  { label: 'Route Planner', path: '/routing' },
  { label: 'Weather', path: '/weather' },
];

export const getHomePrimaryActions = (): HomeAction[] =>
  PRIMARY_ACTIONS.map((action) => ({ ...action }));

export const getHomeTools = (): HomeAction[] =>
  TOOLS.map((action) => ({ ...action }));
