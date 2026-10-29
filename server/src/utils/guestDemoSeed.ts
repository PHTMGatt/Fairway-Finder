import Profile, { ProfileDoc } from '../models/Profile.js';
import Trip, { TripDoc } from '../models/Trip.js';
import { GUEST_MAX_TRIPS, isExpiredGuest } from './guest.js';

const ALEX_SCORES = [4, 5, 4, 4, 5, 3, 4, 5, 4, 4, 4, 5, 3, 4, 5, 4, 4, 5];
const JORDAN_SCORES = [5, 5, 4, 5, 5, 4, 4, 6, 5, 5, 4, 5, 4, 5, 5, 4, 5, 5];

const scorecard = (scores: number[]) =>
  scores.map((score, index) => ({ hole: index + 1, score }));

const demoDate = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
};

const requireActiveGuest = (profile: ProfileDoc) => {
  if (!profile.isGuest || !profile.expiresAt || isExpiredGuest(profile)) {
    throw new Error('Active guest profile required');
  }
};

export const seedGuestDemoTrip = async (profile: ProfileDoc): Promise<TripDoc> => {
  requireActiveGuest(profile);

  const trip = await Trip.create({
    name: 'Fairway Finder Demo Round',
    date: demoDate(),
    courses: [
      {
        name: 'Fairway Finder Demo Course',
        source: 'demo',
        providerId: 'fairway-finder-demo-course',
        address: 'Ann Arbor, MI',
        location: { lat: 42.2808, lng: -83.743 },
        rating: 4.6,
        courseRating: 72.1,
        slope: 128,
      },
    ],
    players: [
      { name: 'Alex', handicap: 12.4, scores: scorecard(ALEX_SCORES) },
      { name: 'Jordan', handicap: 18.1, scores: scorecard(JORDAN_SCORES) },
    ],
    handicap: 15,
    isGuest: true,
    expiresAt: profile.expiresAt,
  });

  const linkedProfile = await Profile.findOneAndUpdate(
    {
      _id: profile._id,
      isGuest: true,
      expiresAt: { $gt: new Date() },
      [`trips.${GUEST_MAX_TRIPS - 1}`]: { $exists: false },
    },
    { $push: { trips: trip._id } },
    { new: true, runValidators: true }
  );

  if (!linkedProfile) {
    await Trip.deleteOne({ _id: trip._id, isGuest: true });
    throw new Error('Could not seed guest demo data');
  }

  return trip;
};

export const resetGuestDemoData = async (profile: ProfileDoc): Promise<TripDoc> => {
  requireActiveGuest(profile);

  const previous = await Profile.findOneAndUpdate(
    { _id: profile._id, isGuest: true, expiresAt: { $gt: new Date() } },
    { $set: { trips: [] } },
    { new: false, runValidators: true }
  );

  if (!previous) {
    throw new Error('Active guest profile required');
  }

  const previousTripIds = previous.trips.map((tripId) => tripId);
  if (previousTripIds.length > 0) {
    await Trip.deleteMany({
      _id: { $in: previousTripIds },
      isGuest: true,
    });
  }

  return seedGuestDemoTrip(profile);
};
