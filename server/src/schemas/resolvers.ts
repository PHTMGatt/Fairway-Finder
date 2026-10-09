// server/src/schemas/resolvers.ts

import { IResolvers } from '@graphql-tools/utils';
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import { signToken } from '../utils/auth.js';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';

interface ProfileType {
  _id: unknown;
  name: string;
  email: string;
}

interface Context {
  user?: ProfileType;
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

const profileOwnsTrip = (profile: { trips: any[] }, tripId: string) =>
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
    // Fetch the currently authenticated user's profile and only their trips.
    me: async (_p, _a, context) => {
      const userId = requireUserId(context);
      return Profile.findById(userId).populate('trips');
    },

    // Fetch only trips owned by the current user.
    trips: async (_p, _a, context) => {
      const profile = await getCurrentProfile(context);
      return Trip.find({ _id: { $in: profile.trips } });
    },

    // Fetch a single trip only when it belongs to the current user.
    trip: async (_p, { id }: { id: string }, context) => {
      const { trip } = await requireOwnedTrip(id, context);
      return transformTrip(trip);
    },
  },

  Mutation: {
    // Register a new user.
    addProfile: async (_p, { input }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await Profile.findOne({ email: normalizedEmail });
      if (existing) {
        throw new UserInputError('Email already in use', {
          invalidArgs: ['email'],
        });
      }

      const profile = await Profile.create({
        ...input,
        name: input.name.trim(),
        email: normalizedEmail,
      });
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },

    // Authenticate an existing user.
    login: async (_p, { email, password }) => {
      const profile = await Profile.findOne({ email: email.trim().toLowerCase() });
      if (!profile) throw new AuthenticationError('No profile found');
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },

    // Create a new trip and attach it to the authenticated profile.
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

    // Delete only a trip owned by the authenticated profile.
    deleteTrip: async (_p, { tripId }, context) => {
      const { profile, trip } = await requireOwnedTrip(tripId, context);
      profile.trips = profile.trips.filter((id) => id.toString() !== tripId) as any;
      await profile.save();
      await trip.deleteOne();
      return trip;
    },

    // Add a course only to a trip owned by the authenticated profile.
    addCourseToTrip: async (_p, { tripId, courseName }, context) => {
      await requireOwnedTrip(tripId, context);
      return Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );
    },

    // Remove a course only from one of the authenticated profile's trips.
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

    // Add a player only to a trip owned by the authenticated profile.
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

    // Remove a player only from a trip owned by the authenticated profile.
    removePlayer: async (_p, { tripId, name }, context) => {
      await requireOwnedTrip(tripId, context);
      return Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true, runValidators: true }
      );
    },

    // Update a score only on a trip owned by the authenticated profile.
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

    // Update a trip-wide handicap only for an owned trip.
    updateTripHandicap: async (_p, { tripId, handicap }, context) => {
      const { trip } = await requireOwnedTrip(tripId, context);
      trip.handicap = handicap;
      await trip.save();
      return trip;
    },

    // Update a player's handicap only for an owned trip.
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
