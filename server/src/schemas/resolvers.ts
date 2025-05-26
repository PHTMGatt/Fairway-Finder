// server/src/schemas/resolvers.ts

import { IResolvers } from '@graphql-tools/utils';
import Profile from '../models/Profile.js';      // ← note the “.js” suffix
import Trip from '../models/Trip.js';            // ← note the “.js” suffix
import { signToken } from '../utils/auth.js';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';

interface ProfileType {
  _id: unknown;         // Note; _id comes in as unknown, so we’ll cast when used
  name: string;
  email: string;
  password: string;
}

interface Context {
  user?: ProfileType;   // Note; populated by authenticateToken middleware
}

const resolvers: IResolvers<any, Context> = {
  Query: {
    // Note; Fetch all profiles (with their trips)
    profiles: async () => Profile.find().populate('trips'),

    // Note; Fetch one profile by ID
    profile: async (_p, { profileId }: { profileId: string }) =>
      Profile.findById(profileId).populate('trips'),

    // Note; “me” query uses context.user
    me: async (_p, _a, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user._id as string;
      return Profile.findById(userId).populate('trips');
    },

    // Note; Fetch all trips
    trips: async () => Trip.find(),

    // Note; Fetch single trip by ID
    trip: async (_p, { id }: { id: string }) => Trip.findById(id),
  },

  Mutation: {
    // Note; Register a new profile
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
      const id = profile._id as string;
      const token = signToken(profile.name, profile.email, id);
      return { token, profile };
    },

    // Note; Login an existing profile
    login: async (_p, { email, password }: { email: string; password: string }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw new AuthenticationError('No profile found');
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');
      const id = profile._id as string;
      const token = signToken(profile.name, profile.email, id);
      return { token, profile };
    },

    // Note; Create a new trip for current user
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

    // Note; Delete a trip for current user
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

    // Note; Add a course to a trip
    addCourseToTrip: async (
      _p,
      { tripId, courseName }: { tripId: string; courseName: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      ),

    // Note; Remove a course from a trip
    removeCourseFromTrip: async (
      _p,
      { courseName }: { courseName: string }
    ) =>
      Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      ),

    // Note; Add a player to a trip
    addPlayer: async (
      _p,
      { tripId, name }: { tripId: string; name: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $addToSet: { players: { name, scores: [] } } },
        { new: true, runValidators: true }
      ),

    // Note; Remove a player from a trip
    removePlayer: async (
      _p,
      { tripId, name }: { tripId: string; name: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true }
      ),

    // Note; Update (or add) a score entry for a player
    updateScore: async (
      _p,
      { tripId, player, hole, score }: 
        { tripId: string; player: string; hole: number; score: number }
    ) => {
      const trip = await Trip.findById(tripId);
      if (!trip) throw new Error('Trip not found');
      const playerObj = trip.players?.find((p) => p.name === player);
      if (!playerObj) throw new Error('Player not found');
      const existing = playerObj.scores.find((s) => s.hole === hole);
      if (existing) existing.score = score;
      else playerObj.scores.push({ hole, score });
      await trip.save();
      return trip;
    },
  },
};

export default resolvers;
