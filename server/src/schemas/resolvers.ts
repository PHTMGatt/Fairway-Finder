// server/src/schemas/'resolvers.ts'

import { IResolvers } from '@graphql-tools/utils';
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import { signToken } from '../utils/auth.js';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';

interface ProfileType {
  _id: unknown;
  name: string;
  email: string;
  password: string;
}

interface Context {
  user?: ProfileType;
}

const resolvers: IResolvers<any, Context> = {
  /** ——— QUERIES ——— **/
  Query: {
    // Note; Fetch all user profiles with their trips (dev)
    profiles: async () => Profile.find().populate('trips'),

    // Note; Fetch a single user profile by ID
    profile: async (_p, { profileId }: { profileId: string }) =>
      Profile.findById(profileId).populate('trips'),

    // Note; Fetch current user based on JWT token
    me: async (_p, _a, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      return Profile.findById(context.user._id).populate('trips');
    },

    // Note; Fetch all trips (dev)
    trips: async () => Trip.find(),

    // Note; Fetch a single trip and transform player scores
    trip: async (_p, { id }: { id: string }) => {
      const trip = await Trip.findById(id);
      if (!trip) return null;

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
          handicap: p.handicap ?? null, // ✅ include individual handicap
        };
      });

      return {
        _id: trip._id,
        name: trip.name,
        date: trip.date,
        courses: trip.courses,
        players: transformedPlayers,
        handicap: trip.handicap, // Note; legacy trip-wide index
      };
    },
  },

  /** ——— MUTATIONS ——— **/
  Mutation: {
    // Note; Register a new user
    addProfile: async (_p, { input }) => {
      const existing = await Profile.findOne({ email: input.email });
      if (existing) {
        throw new UserInputError('Email already in use', {
          invalidArgs: ['email'],
        });
      }
      const profile = await Profile.create(input);
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },

    // Note; Authenticate existing user
    login: async (_p, { email, password }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw new AuthenticationError('No profile found');
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },

    // Note; Create a new trip for current user
    addTrip: async (_p, { input }, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user._id as string;
      const trip = await Trip.create({
        name: input.name,
        date: input.date,
        courses: [{ name: input.courseName }],
      });
      await Profile.findByIdAndUpdate(userId, { $push: { trips: trip._id } });
      return trip;
    },

    // Note; Delete a trip and remove it from user's profile
    deleteTrip: async (_p, { tripId }, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user._id as string;
      await Profile.findByIdAndUpdate(userId, { $pull: { trips: tripId } });
      return Trip.findByIdAndDelete(tripId);
    },

    // Note; Add a course to a trip
    addCourseToTrip: async (_p, { tripId, courseName }) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      ),

    // Note; Remove a course by name
    removeCourseFromTrip: async (_p, { courseName }) =>
      Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      ),

    // Note; Add a player with 18 empty hole scores
    addPlayer: async (_p, { tripId, name }) => {
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

    // Note; Remove a player from a trip
    removePlayer: async (_p, { tripId, name }) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true }
      ),

    // Note; Update or insert a player's hole score
    updateScore: async (_p, { tripId, player, hole, score }) => {
      const trip = await Trip.findById(tripId);
      if (!trip) throw new UserInputError('Trip not found');

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

    // Note; Update overall trip-wide handicap (legacy support)
    updateTripHandicap: async (_p, { tripId, handicap }, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const profile = await Profile.findById(context.user._id);
      if (!profile?.trips.includes(tripId as any)) {
        throw new AuthenticationError('Not your trip');
      }
      const updated = await Trip.findByIdAndUpdate(
        tripId,
        { handicap },
        { new: true, runValidators: true }
      );
      if (!updated) throw new UserInputError('Trip not found');
      return updated;
    },

    // ✅ NEW: Update a specific player's handicap within a trip
    updatePlayerHandicap: async (
      _p,
      { tripId, name, handicap }: { tripId: string; name: string; handicap: number },
      context
    ) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');

      const trip = await Trip.findById(tripId);
      if (!trip) throw new UserInputError('Trip not found');

      const player = trip.players.find((p) => p.name === name);
      if (!player) throw new UserInputError('Player not found');

      player.handicap = handicap;

      await trip.save();
      return trip;
    },
  },
};

export default resolvers;
