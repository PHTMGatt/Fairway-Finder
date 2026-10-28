// server/src/utils/guestCleanup.ts

import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;
const SWEEP_BATCH = 500;

/**
 * Note; Backup for the TTL indexes: delete expired Guest Demo profiles and their trips.
 * Every filter requires isGuest: true AND a past expiresAt date, so permanent
 * accounts and trips can never match. Works in batches so one pass stays bounded.
 */
export const sweepExpiredGuests = async (now = new Date()) => {
  const expired = { isGuest: true, expiresAt: { $type: 'date', $lte: now } };

  const profiles = await Profile.find(expired, { _id: 1, trips: 1 }).limit(SWEEP_BATCH).lean();
  const tripIds = profiles.flatMap((p) => p.trips);
  const profileIds = profiles.map((p) => p._id);

  // Note; Trips first, so a crash mid-sweep never leaves a deleted profile's trips unreachable
  const tripsByOwner = tripIds.length
    ? (await Trip.deleteMany({ _id: { $in: tripIds }, isGuest: true })).deletedCount
    : 0;
  const deletedProfiles = profileIds.length
    ? (await Profile.deleteMany({ _id: { $in: profileIds }, ...expired })).deletedCount
    : 0;
  // Note; Guest trips whose profile is already gone (e.g. TTL removed it first)
  const orphanTrips = (await Trip.deleteMany(expired)).deletedCount;

  return { profiles: deletedProfiles, trips: tripsByOwner + orphanTrips };
};

/**
 * Note; Run the sweep now and every SWEEP_INTERVAL_MS. Failures are logged, never thrown.
 */
export const startGuestCleanup = () => {
  const run = async () => {
    try {
      const { profiles, trips } = await sweepExpiredGuests();
      if (profiles || trips) {
        console.log(`🧹 Guest cleanup removed ${profiles} expired guest profile(s) and ${trips} trip(s)`);
      }
    } catch (err) {
      console.error('❌ Guest cleanup failed:', err instanceof Error ? err.message : err);
    }
  };
  void run();
  const timer = setInterval(run, SWEEP_INTERVAL_MS);
  timer.unref();
  return timer;
};
