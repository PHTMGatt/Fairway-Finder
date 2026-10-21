// server/src/schemas/resolvers.ts

import { IResolvers } from '@graphql-tools/utils';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import { claimInvite, isInviteUsable, markInviteUsedBy, releaseInvite } from '../models/Invite.js';
import { signToken } from '../utils/auth.js';
import { enforceRateLimit, loginLimiter, signupLimiter } from '../utils/rateLimit.js';
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

const profileOwnsTrip =(profile: { trips: any[] }, tripId: string) =>
  profile.trips.some((id) => id.toString() === tripId);

const requireOwnedTrip = async (tripId: string, context: Context) => {
  const profile = await getCurrentProfile(context);

  if (!profileOwnsTrip(profile, tripId)) {
    throw new AuthenticationError('Not authorized to access this trip');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new UserInputError('Trip not found');
  }

  return { profile, trip };
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
  Query: {
    me: async (_p, _a, context) => {
      const userId = requireUserId(context);
      return Profile.findById(userId).populate('trips');
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
      if (!profile) {
        await bcrypt.compare(password, TIMING_DUMMY_HASH);
        throw new AuthenticationError(INVALID_LOGIN_MESSAGE);
      }
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError(INVALID_LOGIN_MESSAGE);
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },

    addTrip: async (_p, { input }, context) => {
      const profile = await getCurrentProfile(context);
      const trip = await Trip.create({
        name: input.name,
        date: input.date,
        courses: [{ name: input.courseName }],
      });

      profile.trips.push(trip._id as any);
      await profile.save();
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
      await requireOwnedTrip(tripId, context);
      return Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );
    },

    removeCourseFromTrip: async (_p, { courseName }, context) => {
      const profile = await getCurrentProfile(context);
      const trip = await Trip.findOneAndUpdate(
        { _id: { $in: profile.trips }, 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );

      if (!trip) {
        throw new UserInputError('Course not found on one of your trips');
      }
      return trip;
    },

    addPlayer: async (_p, { tripId, name }, context) => {
      await requireOwnedTrip(tripId, context);
      const fullScores = Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        score: 0,
      }));

      return Trip.findByIdAndUpdate(
        tripId,
        { $push: { players: { name, scores: fullScores } } },
        { new: true, runValidators: true }
      );
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
