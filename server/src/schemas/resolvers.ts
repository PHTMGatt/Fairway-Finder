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

// Note; Same message for unknown email and wrong password so login can't be used to probe for accounts
const INVALID_LOGIN_MESSAGE = 'Invalid email or password';

// Note; Compared against when the email isn't found, so unknown emails take as long as wrong
// passwords. Same cost (10) as Profile's pre-save hash; matches no real password.
const TIMING_DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), 10);

// Note; Rules for NEW passwords only; existing accounts keep their current passwords.
// bcrypt ignores everything after 72 bytes, so longer passwords are rejected rather than silently truncated.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

// Note; Unique-index races surface as Mongo E11000; map them to a clean input error
const toDuplicateKeyError = (err: any) => {
  if (err?.code !== 11000) return err;
  const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0];
  return field === 'name'
    ? new UserInputError('Username already taken', { invalidArgs: ['name'] })
    : new UserInputError('Email already in use', { invalidArgs: ['email'] });
};

const profileOwnsTrip = (profile: { trips: any[] }, tripId: string) =>
  profile.trips.some((id) => id.toString() === tripId);

const requireOwnedTrip = async (tripId: string, context: Context) => {
  const profile = await getCurrentProfile(context);

  // Note; Someone else's trip looks exactly like a missing one: no auth error (which would log the
  // user out on the client) and no hint that the trip exists
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
    ...(input.location
      ? { location: { lat: input.location.lat, lng: input.location.lng } }
      : {}),
    ...(typeof input.rating === 'number' ? { rating: input.rating } : {}),
    ...(optionalText(input.golfCourseApiId)
      ? { golfCourseApiId: optionalText(input.golfCourseApiId) }
      : {}),
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

    return {
      name: p.name,
      score: scoreObj,
      total,
      handicap: p.handicap ?? null,
    };
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

      if (
        password.length < PASSWORD_MIN_LENGTH ||
        Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES
      ) {
        throw new UserInputError(
          `Password must be ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_BYTES} characters`,
          { invalidArgs: ['password'] }
        );
      }

      checkText(name, 'name', 'Username', LIMITS.username);
      if (isReservedGuestName(name)) {
        throw new UserInputError('Usernames starting with "guest-" are reserved', { invalidArgs: ['name'] });
      }
      if (isReservedGuestEmail(email)) {
        throw new UserInputError('That email address is not allowed', { invalidArgs: ['email'] });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const invalidInvite = () =>
        new UserInputError('Invalid or expired invite code', { invalidArgs: ['inviteCode'] });

      // Note; Validate the invite first so "Email already in use" is only revealed to invite holders
      if (!(await isInviteUsable(inviteCode, normalizedEmail))) throw invalidInvite();

      // Note; Checked before claiming so a taken email doesn't burn the invite
      const existing = await Profile.findOne({ email: normalizedEmail });
      if (existing) {
        throw new UserInputError('Email already in use', {
          invalidArgs: ['email'],
        });
      }

      const invite = await claimInvite(inviteCode, normalizedEmail);
      if (!invite) throw invalidInvite();

      let profile;
      try {
        profile = await Profile.create({
          name: name.trim(),
          email: normalizedEmail,
          password,
        });
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
      // Note; Guest accounts can never sign in by password; they look like unknown emails
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
      const token = signToken(profile.name, profile.email, profile._id as string, {
        notAfter: profile.expiresAt as Date,
        isGuest: true,
      });
      return { token, profile };
    },

    addTrip: async (_p, { input }, context) => {
      checkText(input.name, 'name', 'Trip name', LIMITS.tripName);
      checkText(input.date, 'date', 'Trip date', LIMITS.tripDate);

      const selectedCourse: TripCourseInput | null = input.course
        ?? (typeof input.courseName === 'string' ? { name: input.courseName } : null);
      if (!selectedCourse) {
        throw new UserInputError('A course is required', { invalidArgs: ['course'] });
      }
      const course = normalizeTripCourse(selectedCourse);

      const profile = await getCurrentProfile(context);
      if (profile.isGuest && profile.trips.length >= GUEST_MAX_TRIPS) {
        throw new UserInputError(`The guest demo is limited to ${GUEST_MAX_TRIPS} trips`);
      }
      const trip = await Trip.create({
        name: input.name,
        date: input.date,
        courses: [course],
        // Note; Guest trips expire with their guest, set in the same write
        ...(profile.isGuest ? { isGuest: true, expiresAt: profile.expiresAt } : {}),
      });

      profile.trips.push(trip._id as any);
      try {
        await profile.save();
      } catch (error) {
        // The Trip was created first. If linking it to the owner fails, remove
        // the unowned document so an application-level failure does not create
        // another orphan Trip.
        try {
          await Trip.deleteOne({ _id: trip._id });
        } catch (cleanupError) {
          console.error(
            'Failed to clean up Trip after profile link failure:',
            cleanupError instanceof Error ? cleanupError.message : cleanupError
          );
        }
        throw error;
      }
      return trip;
    },

    deleteTrip: async (_p, { tripId }, context) => {
      const { profile, trip } = await requireOwnedTrip(tripId, context);
      const originalTripRefs = [...profile.trips];
      profile.trips = profile.trips.filter((id) => id.toString() !== tripId) as any;
      await profile.save();

      try {
        await trip.deleteOne();
      } catch (error) {
        // The ownership reference is removed first so a successful delete does
        // not leave a dangling profile ref. If the Trip delete itself fails,
        // restore the known-good ownership list before surfacing the failure.
        profile.trips = originalTripRefs as any;
        try {
          await profile.save();
        } catch (restoreError) {
          console.error(
            'Failed to restore Trip ownership after delete failure:',
            restoreError instanceof Error ? restoreError.message : restoreError
          );
        }
        throw error;
      }
      return trip;
    },

    addCourseToTrip: async (_p, { tripId, courseName }, context) => {
      checkText(courseName, 'courseName', 'Course name', LIMITS.courseName);
      await requireOwnedTrip(tripId, context);
      // Note; The cap is part of the update filter so concurrent adds can't exceed it
      const updated = await Trip.findOneAndUpdate(
        { _id: tripId, [`courses.${LIMITS.coursesPerTrip - 1}`]: { $exists: false } },
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );
      if (!updated) {
        throw new UserInputError(`A trip can have at most ${LIMITS.coursesPerTrip} courses`);
      }
      return updated;
    },

    removeCourseFromTrip: async (_p, { tripId, courseId }, context) => {
      const { trip } = await requireOwnedTrip(tripId, context);
      const courseIndex = trip.courses.findIndex(
        (course) => course._id.toString() === courseId
      );

      if (courseIndex === -1) {
        throw new UserInputError('Course not found on this trip');
      }

      trip.courses.splice(courseIndex, 1);
      await trip.save();
      return trip;
    },

    addPlayer: async (_p, { tripId, name }, context) => {
      checkText(name, 'name', 'Player name', LIMITS.playerName);
      const { trip } = await requireOwnedTrip(tripId, context);
      // Note; Scores and handicaps are looked up by player name, so names must be unique per trip
      if (trip.players.some((p) => p.name === name.trim())) {
        throw new UserInputError('That player is already on this trip', { invalidArgs: ['name'] });
      }
      const fullScores = Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        score: 0,
      }));

      // Note; The cap is part of the update filter so concurrent adds can't exceed it
      const updated = await Trip.findOneAndUpdate(
        { _id: tripId, [`players.${LIMITS.playersPerTrip - 1}`]: { $exists: false } },
        { $push: { players: { name, scores: fullScores } } },
        { new: true, runValidators: true }
      );
      if (!updated) {
        throw new UserInputError(`A trip can have at most ${LIMITS.playersPerTrip} players`);
      }
      return updated;
    },

    removePlayer: async (_p, { tripId, name }, context) => {
      await requireOwnedTrip(tripId, context);
      return Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true, runValidators: true }
      );
    },

    updateScore: async (_p, { tripId, player, hole, score }, context) => {
      checkRange(hole, 'hole', 'Hole', LIMITS.hole, true);
      checkRange(score, 'score', 'Score', LIMITS.score, true);
      const { trip } = await requireOwnedTrip(tripId, context);
      const playerObj = trip.players.find((p) => p.name === player);
      if (!playerObj) throw new UserInputError('Player not found');

      const existing = playerObj.scores.find((s) => s.hole === hole);
      if (existing) {
        existing.score = score;
      } else {
        playerObj.scores.push({ hole, score });
      }

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

    updatePlayerHandicap: async (
      _p,
      { tripId, name, handicap }: { tripId: string; name: string; handicap: number },
      context
    ) => {
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