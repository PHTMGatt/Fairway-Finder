export interface HeaderNavigationItem {
  label: string;
  path: string;
}

export const getHeaderNavigation = (
  isLoggedIn: boolean
): HeaderNavigationItem[] =>
  isLoggedIn
    ? [
        { label: 'Plan Trip', path: '/plan-trip' },
        { label: 'My Trips', path: '/saved-trips' },
      ]
    : [
        { label: 'Log In', path: '/login' },
        { label: 'Invite Sign Up', path: '/signup' },
      ];
