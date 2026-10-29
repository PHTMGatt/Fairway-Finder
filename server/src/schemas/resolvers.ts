// server/src/schemas/resolvers.ts

import { IResolvers } from '@graphql-tools/utils';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import { claimInvite, isInviteUsable, markInviteUsedBy, releaseInvite } from '../models/Invite.js';
import { signToken } from '../utils/auth.js';
import { enforceRateLimit, guestLimiter, loginLimiter, signupLimiter } from '../utils/rateLimit.js';
import { LIMITS, checkRange, checkText } from '../utils/validate.js';
import {
  GUEST_MAX_TRIPS,
  createGuestProfile,
  isExpiredGuest,
  isReservedGuestEmail,
  isReservedGuestName,
} from '../utils/guest.js';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';

interface ProfileType {
  _id: unknown;
  name: string;
  email: string;
}

interface Context {
  user?: ProfileType;
  ip?: string;
}

interface TripCourseInput {
  name: string;
  source?: string | null;
  providerId?: string | null;
  address?: string | null;
  location?: { lat: number; lng: number } | null;
  rating?: number | null;
  golfCourseApiId?: string | null;
  courseRating?: number | null;
  slope?: number | null;
}

const requireUserId = (context: Context): string => {
  if (!context.user?._id) {
    throw new AuthenticationError('Not authenticated');
  }
  return String(context.user._id);
};

const getCurrentProfile = async (context: Context) => {
  const userId = requireUserId(context);
  const profile = await Profile.findById(userId);

  if (!profile) {
    throw new AuthenticationError('Profile no longer exists');
  }
  // Note; Decided from the database record, never the token; TTL deletion can lag a minute
  if (isExpiredGuest(profile)) {
    throw new AuthenticationError('Your guest demo has ended', { reason: 'GUEST_EXPIRED' });
  }

  return profile;
};

const INVALID_LOGIN_MESSAGE = 'Invalid email or password';
const TIMING_DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), 10);
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

const toDuplicateKeyError = (err: any) => {
  if (err?.code !== 11000) return err;
  const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0];
  return field === 'name'
    ? new UserInputError('Username already taken', { invalidArgs: ['name'] })
    : new UserInputError('Email already in use', { invalidArgs: ['email'] });
};

const profileOwnsTrip =(profile: { trips: any[] }, tripId: string) =>
  profile.trips.some((id) => id.toString() === tripId);

const requireOwnedTrip = async (tripId: string, context: Context) => {
  const profile = await getCurrentProfile(context);
  if (!profileOwnsTrip(profile, tripId)) {
    throw new UserInputError('Trip not found');
  }
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new UserInputError('Trip not found');
  }
  return { profile, trip };
};

const optionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeTripCourse = (input: TripCourseInput) => {
  checkText(input.name, 'courseName', 'Course name', LIMITS.courseName);
  return {
    name: input.name.trim(),
    ...(optionalText(input.source) ? { source: optionalText(input.source) } : {}),
    ...(optionalText(input.providerId) ? { providerId: optionalText(input.providerId) } : {}),
    ...(optionalText(input.address) ? { address: optionalText(input.address) } : {}),
    ...(input.location ? { location: { lat: input.location.lat, lng: input.location.lng } } : {}),
    ...(typeof input.rating === 'number' ? { rating: input.rating } : {}),
    ...(optionalText(input.golfCourseApiId) ? { golfCourseApiId: optionalText(input.golfCourseApiId) } : {}),
    ...(typeof input.courseRating === 'number' ? { courseRating: input.courseRating } : {}),
    ...(typeof input.slope === 'number' ? { slope: input.slope } : {}),
  };
};

const transformTrip = (trip: any) => {
  const transformedPlayers = trip.players.map((p: any) => {
    const ordered = Array.from({ length: 18 }, (_, idx) => {
      const holeNum = idx + 1;
      const found = p.scores.find((s: any) => s.hole === holeNum);
      return { hole: holeNum, score: found?.score ?? 0 };
    });
    let total = 0;
    const scoreObj: Record<string, number> = {};
    ordered.forEach(({ hole, score }) => {
      scoreObj[`H${hole}`] = score;
      total += score;
    });
    return { name: p.name, score: scoreObj, total, handicap: p.handicap ?? null };
  });
  return {
    _id: trip._id,
    name: trip.name,
    date: trip.date,
    courses: trip.courses,
    players: transformedPlayers,
    handicap: trip.handicap,
  };
};

const resolvers: IResolvers<any, Context> = {
  Profile: {
    isGuest: (profile) => profile.isGuest === true,
    expiresAt: (profile) => (profile.expiresAt ? new Date(profile.expiresAt).toISOString() : null),
  },
  Query: {
    me: async (_p, _a, context) => {
      const profile = await getCurrentProfile(context);
      return profile.populate('trips');
    },
    trips: async (_p, _a, context) => {
      const profile = await getCurrentProfile(context);
      return Trip.find({ _id: { $in: profile.trips } });
    },
    trip: async (_p, { id }: { id: string }, context) => {
      const { trip } = await requireOwnedTrip(id, context);
      return transformTrip(trip);
    },
  },
  Mutation: {
    addProfile: async (_p, { input }, context) => {
      enforceRateLimit(signupLimiter, context.ip);
      const { name, email, password, inviteCode } = input;
      if (password.length < PASSWORD_MIN_LENGTH || Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
        throw new UserInputError(`Password must be ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_BYTES} characters`, { invalidArgs: ['password'] });
      }
      checkText(name, 'name', 'Username', LIMITS.username);
      if (isReservedGuestName(name)) throw new UserInputError('Usernames starting with "guest-" are reserved', { invalidArgs: ['name'] });
      if (isReservedGuestEmail(email)) throw new UserInputError('That email address is not allowed', { invalidArgs: ['email'] });
      const normalizedEmail = email.trim().toLowerCase();
      const invalidInvite = () => new UserInputError('Invalid or expired invite code', { invalidArgs: ['inviteCode'] });
      if (!(await isInviteUsable(inviteCode, normalizedEmail))) throw invalidInvite();
      const existing = await Profile.findOne({ email: normalizedEmail });
      if (existing) throw new UserInputError('Email already in use', { invalidArgs: ['email'] });
      const invite = await claimInvite(inviteCode, normalizedEmail);
      if (!invite) throw invalidInvite();
      let profile;
      try {
        profile = await Profile.create({ name: name.trim(), email: normalizedEmail, password });
      } catch (err) {
        await releaseInvite(invite._id as any);
        throw toDuplicateKeyError(err);
      }
      await markInviteUsedBy(invite._id as any, profile._id as any);
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },
    login: async (_p, { email, password }, context) => {
      enforceRateLimit(loginLimiter, context.ip);
      const normalizedEmail = email.trim().toLowerCase();
      const profile = await Profile.findOne({ email: normalizedEmail }).select('+password');
      if (!profile || profile.isGuest) {
        await bcrypt.compare(password, TIMING_DUMMY_HASH);
        throw new AuthenticationError(INVALID_LOGIN_MESSAGE);
      }
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError(INVALID_LOGIN_MESSAGE);
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },
    startGuestSession: async (_p, _a, context) => {
      enforceRateLimit(guestLimiter, context.ip);
      const profile = await createGuestProfile();
      const token = signToken(profile.name, profile.email, profile._id as string, { notAfter: profile.expiresAt as Date, isGuest: true });
      return { token, profile };
    },
    addTrip: async (_p, { input }, context) => {
      checkText(input.name, 'name', 'Trip name', LIMITS.tripName);
      checkText(input.date, 'date', 'Trip date', LIMITS.tripDate);
      const selectedCourse: TripCourseInput | null = input.course ?? (typeof input.courseName === 'string' ? { name: input.courseName } : null);
      if (!selectedCourse) throw new UserInputError('A course is required', { invalidArgs: ['course'] });
      const course = normalizeTripCourse(selectedCourse);
      const profile = await getCurrentProfile(context);
      const trip = await Trip.create({
        name: input.name,
        date: input.date,
        courses: [course],
        ...(profile.isGuest ? { isGuest: true, expiresAt: profile.expiresAt } : {}),
      });

      // Link the trip atomically. For guests, the array-position predicate makes the three-trip
      // limit part of the MongoDB write so concurrent requests cannot race past the demo cap.
      const linkedProfile = await Profile.findOneAndUpdate(
        profile.isGuest
          ? {
              _id: profile._id,
              isGuest: true,
              expiresAt: { $gt: new Date() },
              [`trips.${GUEST_MAX_TRIPS - 1}`]: { $exists: false },
            }
          : { _id: profile._id },
        { $push: { trips: trip._id } },
        { new: true, runValidators: true }
      );

      if (!linkedProfile) {
        // Never leave an unowned trip behind when the guest cap/expiry wins the race.
        await Trip.deleteOne({ _id: trip._id });
        if (profile.isGuest) {
          const current = await Profile.findById(profile._id);
          if (!current || isExpiredGuest(current)) {
            throw new AuthenticationError('Your guest demo has ended', { reason: 'GUEST_EXPIRED' });
          }
          throw new UserInputError(`The guest demo is limited to ${GUEST_MAX_TRIPS} trips`);
        }
        throw new AuthenticationError('Profile no longer exists');
      }
      return trip;
    },
    deleteTrip: async (_p, { tripId }, context) => {
      const { profile, trip } = await requireOwnedTrip(tripId, context);
      profile.trips = profile.trips.filter((id) => id.toString() !== tripId) as any;
      await profile.save();
      await trip.deleteOne();
      return trip;
    },
    addCourseToTrip: async (_p, { tripId, courseName }, context) => {
      checkText(courseName, 'courseName', 'Course name', LIMITS.courseName);
      await requireOwnedTrip(tripId, context);
      const updated = await Trip.findOneAndUpdate(
        { _id: tripId, [`courses.${LIMITS.coursesPerTrip - 1}`]: { $exists: false } },
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );
      if (!updated) throw new UserInputError(`A trip can have at most ${LIMITS.coursesPerTrip} courses`);
      return updated;
    },
    removeCourseFromTrip: async (_p, { tripId, courseId }, context) => {
      const { trip } = await requireOwnedTrip(tripId, context);
      const courseIndex = trip.courses.findIndex((course) => course._id.toString() === courseId);
      if (courseIndex === -1) throw new UserInputError('Course not found on this trip');
      trip.courses.splice(courseIndex, 1);
      await trip.save();
      return trip;
    },
    addPlayer: async (_p, { tripId, name }, context) => {
      checkText(name, 'name', 'Player name', LIMITS.playerName);
      const normalizedName = name.trim();
      const { trip } = await requireOwnedTrip(tripId, context);
      if (trip.players.some((p) => p.name === normalizedName)) throw new UserInputError('That player is already on this trip', { invalidArgs: ['name'] });
      const fullScores = Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, score: 0 }));
      const updated = await Trip.findOneAndUpdate(
        { _id: tripId, 'players.name': { $ne: normalizedName }, [`players.${LIMITS.playersPerTrip - 1}`]: { $exists: false } },
        { $push: { players: { name: normalizedName, scores: fullScores } } },
        { new: true, runValidators: true }
      );
      if (!updated) {
        const current = await Trip.findById(tripId).select('players.name').lean();
        if (current?.players.some((p) => p.name === normalizedName)) throw new UserInputError('That player is already on this trip', { invalidArgs: ['name'] });
        throw new UserInputError(`A trip can have at most ${LIMITS.playersPerTrip} players`);
      }
      return updated;
    },
    removePlayer: async (_p, { tripId, name }, context) => {
      await requireOwnedTrip(tripId, context);
      return Trip.findByIdAndUpdate(tripId, { $pull: { players: { name } } }, { new: true, runValidators: true });
    },
    updateScore: async (_p, { tripId, player, hole, score }, context) => {
      checkRange(hole, 'hole', 'Hole', LIMITS.hole, true);
      checkRange(score, 'score', 'Score', LIMITS.score, true);
      const { trip } = await requireOwnedTrip(tripId, context);
      const playerObj = trip.players.find((p) => p.name === player);
      if (!playerObj) throw new UserInputError('Player not found');
      const existing = playerObj.scores.find((s) => s.hole === hole);
      if (existing) existing.score = score;
      else playerObj.scores.push({ hole, score });
      await trip.save();
      return trip;
    },
    updateTripHandicap: async (_p, { tripId, handicap }, context) => {
      checkRange(handicap, 'handicap', 'Handicap', LIMITS.handicap);
      const { trip } = await requireOwnedTrip(tripId, context);
      trip.handicap = handicap;
      await trip.save();
      return trip;
    },
    updatePlayerHandicap: async (_p, { tripId, name, handicap }: { tripId: string; name: string; handicap: number }, context) => {
      checkRange(handicap, 'handicap', 'Handicap', LIMITS.handicap);
      const { trip } = await requireOwnedTrip(tripId, context);
      const player = trip.players.find((p) => p.name === name);
      if (!player) throw new UserInputError('Player not found');
      player.handicap = handicap;
      await trip.save();
      return trip;
    },
  },
};

export default resolvers;