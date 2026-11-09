import type { SessionInfo } from '../../utils/auth';

export interface GuestBannerState {
  expiresAt: Date;
  warning: boolean;
  expired: boolean;
}

export const getGuestBannerState = (
  session: SessionInfo | null,
  now: number = Date.now()
): GuestBannerState | null => {
  if (!session?.isGuest || !session.expiresAt) return null;
  const remaining = session.expiresAt.getTime() - now;
  return {
    expiresAt: session.expiresAt,
    warning: remaining <= 2 * 60 * 60 * 1000,
    expired: remaining <= 0,
  };
};
