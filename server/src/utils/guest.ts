// server/src/utils/guest.ts

/**
 * Note; Guest Demo accounts are named guest-<random hex> with a <hex>@guest.invalid email.
 * Permanent sign-ups may not use either, so a real user can't squat a guest identity
 * (and guest creation can't collide with a real account).
 */
export const GUEST_NAME_PREFIX = 'guest-';
export const GUEST_EMAIL_DOMAIN = '@guest.invalid';

export const isReservedGuestName = (name: string) =>
  name.trim().toLowerCase().startsWith(GUEST_NAME_PREFIX);

export const isReservedGuestEmail = (email: string) =>
  email.trim().toLowerCase().endsWith(GUEST_EMAIL_DOMAIN);
