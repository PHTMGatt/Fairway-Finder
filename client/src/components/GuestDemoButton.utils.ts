export const GUEST_DEMO_NOTE =
  'Your isolated demo data is automatically deleted after 24 hours.';

interface StartGuestSessionData {
  startGuestSession?: {
    token?: string | null;
  } | null;
}

export interface GuestDemoNavigation {
  destination: string;
  options: {
    replace: true;
    state?: unknown;
  };
}

export const extractGuestToken = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const session = (data as StartGuestSessionData).startGuestSession;
  return typeof session?.token === 'string' && session.token.length > 0
    ? session.token
    : null;
};

export const getGuestDemoNavigation = (
  destination = '/saved-trips',
  state?: unknown
): GuestDemoNavigation => ({
  destination,
  options: {
    replace: true,
    ...(state === undefined ? {} : { state }),
  },
});
