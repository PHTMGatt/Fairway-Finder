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
    // Fetch all profiles (with their trips)
    profiles: async () => Profile.find().populate('trips'),

    // Fetch one profile by ID
    profile: async (_p, { profileId }: { profileId: string }) =>
      Profile.findById(profileId).populate('trips'),

    // “me” query uses context.user
    me: async (_p, _a, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user._id as string;
      return Profile.findById(userId).populate('trips');
    },

    // Fetch all trips
    trips: async () => Trip.find(),

    // Fetch single trip by ID and reshape scorecard
    trip: async (_p, { id }: { id: string }) => {
      const trip = await Trip.findById(id);
      if (!trip) return null;

      const transformedPlayers = trip.players.map((p) => {
        // build ordered array 1–18
        const ordered = Array.from({ length: 18 }, (_, idx) => {
          const holeNum = idx + 1;
          const found = p.scores.find((s) => s.hole === holeNum);
          return { hole: holeNum, score: found?.score ?? 0 };
        });

        // build score object H1–H18 & tally total
        const score: Record<string, number> = {};
        let total = 0;
        ordered.forEach(({ hole, score: s }) => {
          score[`H${hole}`] = s;
          total += s;
        });

        return {
          name: p.name,
          score,   // unified score object
          total,   // server-computed total
        };
      });

      return {
        _id: trip._id,
        name: trip.name,
        date: trip.date,
        courses: trip.courses,
        players: transformedPlayers,
      };
    },
  },

  Mutation: {
    // Register a new profile
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

    // Login an existing profile
    login: async (_p, { email, password }: { email: string; password: string }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw new AuthenticationError('No profile found');
      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');
      const id = profile._id as string;
      const token = signToken(profile.name, profile.email, id);
      return { token, profile };
    },

    // Create a new trip for current user
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

    // Delete a trip for current user
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

    // Add a course to a trip
    addCourseToTrip: async (
      _p,
      { tripId, courseName }: { tripId: string; courseName: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      ),

    // Remove a course from a trip
    removeCourseFromTrip: async (
      _p,
      { courseName }: { courseName: string }
    ) =>
      Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      ),

    // Add a player with 18 zeroed scores
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

    // Remove a player
    removePlayer: async (
      _p,
      { tripId, name }: { tripId: string; name: string }
    ) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true }
      ),

    // Update (or add) a score entry
    updateScore: async (
      _p,
      { tripId, player, hole, score }:
        { tripId: string; player: string; hole: number; score: number }
    ) => {
      const trip = await Trip.findById(tripId);
      if (!trip) throw new Error('Trip not found');

      const playerObj = trip.players.find((p) => p.name === player);
      if (!playerObj) throw new Error('Player not found');

      const existing = playerObj.scores.find((s) => s.hole === hole);
      if (existing) {
        existing.score = score;
      } else {
        playerObj.scores.push({ hole, score });
      }

      await trip.save();
      return trip;
    },
  },
};

export default resolvers;
