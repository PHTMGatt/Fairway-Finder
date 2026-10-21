// server/src/utils/guest.ts

import { randomBytes } from 'crypto';
import { GraphQLError } from 'graphql';
import Profile from '../models/Profile.js';

/**
 * Note; Guest Demo accounts are named guest-<random hex> with a <hex>@guest.invalid email.
 * Permanent sign-ups may not use either, so a real user can't squat a guest identity
 * (and guest creation can't collide with a real account).
 */
export const GUEST_NAME_PREFIX = 'guest-';
export const GUEST_EMAIL_DOMAIN = '@guest.invalid';

// Note; A Guest Demo and all its trips are deleted this long after it starts
export const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
// Note; Trips a single guest may create
export const GUEST_MAX_TRIPS = 3;
// Note; Site-wide cap on simultaneously active guests (override with GUEST_MAX_ACTIVE)
const DEFAULT_GUEST_MAX_ACTIVE = 200;

export const isReservedGuestName = (name: string) =>
  name.trim().toLowerCase().startsWith(GUEST_NAME_PREFIX);

export const isReservedGuestEmail = (email: string) =>
  email.trim().toLowerCase().endsWith(GUEST_EMAIL_DOMAIN);

const guestMaxActive = () => {
  const configured = Number(process.env.GUEST_MAX_ACTIVE);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_GUEST_MAX_ACTIVE;
};

/**
 * Note; True when a profile is a guest whose time is up. The TTL monitor deletes these
 * within about a minute, but requests in the meantime must already be refused.
 */
export const isExpiredGuest = (profile: { isGuest?: boolean; expiresAt?: Date }) =>
  profile.isGuest === true && (!profile.expiresAt || profile.expiresAt.getTime() <= Date.now());

/**
 * Note; Create a new anonymous Guest Demo profile that expires after GUEST_TTL_MS.
 */
export const createGuestProfile = async () => {
  const now = new Date();
  const active = await Profile.countDocuments({ isGuest: true, expiresAt: { $gt: now } });
  if (active >= guestMaxActive()) {
    throw new GraphQLError('The guest demo is busy right now. Please try again later.', {
      extensions: { code: 'GUEST_CAPACITY' },
    });
  }

  const expiresAt = new Date(now.getTime() + GUEST_TTL_MS);
  // Note; 96 random bits makes a collision practically impossible; retry anyway on E11000
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomBytes(12).toString('hex');
    try {
      return await Profile.create({
        name: `${GUEST_NAME_PREFIX}${id}`,
        email: `${id}${GUEST_EMAIL_DOMAIN}`,
        password: randomBytes(32).toString('hex'), // Note; never shown; guests can't log in by password
        isGuest: true,
        expiresAt,
      });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new Error('Could not create a guest profile');
};
