// server/src/resolvers/index.ts

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
  Query: {
    //Note; Fetch all profiles (with their trips)
    profiles: async () => Profile.find().populate('trips'),

    //Note; Fetch one profile by ID
    profile: async (_p, { profileId }: { profileId: string }) =>
      Profile.findById(profileId).populate('trips'),

    //Note; “me” query uses context.user
    me: async (_p, _a, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      return Profile.findById(context.user._id).populate('trips');
    },

    //Note; Fetch all trips
    trips: async () => Trip.find(),

    //Note; Fetch single trip by ID and reshape scorecard + include handicap
    trip: async (_p, { id }: { id: string }) => {
      const trip = await Trip.findById(id);
      if (!trip) return null;

      // reshape players
      const transformedPlayers = trip.players.map((p) => {
        const ordered = Array.from({ length: 18 }, (_, idx) => {
          const holeNum = idx + 1;
          const found = p.scores.find((s) => s.hole === holeNum);
          return { hole: holeNum, score: found?.score ?? 0 };
        });
        let total = 0;
        const scoreObj: Record<string, number> = {};
        ordered.forEach(({ hole, score }) => {
          scoreObj[`H${hole}`] = score;
          total += score;
        });
        return { name: p.name, score: scoreObj, total };
      });

      return {
        _id: trip._id,
        name: trip.name,
        date: trip.date,
        courses: trip.courses,
        players: transformedPlayers,
        handicap: trip.handicap, //Note; return stored index
      };
    },
  },

  Mutation: {
    //Note; Register a new profile
    addProfile: async (
      _p,
      { input }: { input: { name: string; email: string; password: string } }
    ) => {
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

    //Note; Login an existing profile
    login: async (_p, { email, password }: { email: string; password: string }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw new AuthenticationError('No profile found');
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');
      const token = signToken(profile.name, profile.email, profile._id as string);
      return { token, profile };
    },

    //Note; Create a new trip for current user
    addTrip: async (
      _p,
      { input }: { input: { name: string; date: string; courseName: string } },
      context
    ) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user._id as string;
      const trip = await Trip.create({
        name: input.name,
        date: input.date,
        courses: [{ name: input.courseName }],
      });
      await Profile.findByIdAndUpdate(userId, {
        $push: { trips: trip._id },
      });
      return trip;
    },

    //Note; Delete a trip for current user
    deleteTrip: async (
      _p,
      { tripId }: { tripId: string },
      context
    ) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user._id as string;
      await Profile.findByIdAndUpdate(userId, {
        $pull: { trips: tripId },
      });
      return Trip.findByIdAndDelete(tripId);
    },

    //Note; Add a course to a trip
    addCourseToTrip: async (
      _p,
      { tripId, courseName }: { tripId: string; courseName: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      ),

    //Note; Remove a course from a trip
    removeCourseFromTrip: async (
      _p,
      { courseName }: { courseName: string }
    ) =>
      Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      ),

    //Note; Add a player with 18 zeroed scores
    addPlayer: async (
      _p,
      { tripId, name }: { tripId: string; name: string }
    ) => {
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

    //Note; Remove a player
    removePlayer: async (
      _p,
      { tripId, name }: { tripId: string; name: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true }
      ),

    //Note; Update (or add) a score entry
    updateScore: async (
      _p,
      {
        tripId,
        player,
        hole,
        score,
      }: { tripId: string; player: string; hole: number; score: number }
    ) => {
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

    //Note; New mutation to persist computed handicap
    updateTripHandicap: async (
      _p,
      { tripId, handicap }: { tripId: string; handicap: number },
      context
    ) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      //Note; ensure user owns this trip
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
  },
};

export default resolvers;
