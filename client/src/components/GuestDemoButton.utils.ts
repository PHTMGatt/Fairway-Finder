export const GUEST_DEMO_NOTE = 'Temporary demo data is automatically deleted after 24 hours.';

interface StartGuestSessionData {
  startGuestSession?: {
    token?: string | null;
  } | null;
}

export const extractGuestToken = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const session = (data as StartGuestSessionData).startGuestSession;
  return typeof session?.token === 'string' && session.token.length > 0
    ? session.token
    : null;
};
