import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import { signToken } from '../utils/auth.js';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';

interface ProfileType {
  _id: any;
  name: string;
  email: string;
  password: string;
}

interface Context {
  user?: ProfileType;
}

const resolvers = {
  Query: {
    profiles: async () => Profile.find().populate('trips'),
    profile: async (_: any, { profileId }: { profileId: string }) =>
      Profile.findById(profileId).populate('trips'),
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      return Profile.findById(context.user._id).populate('trips');
    },
    trips: async () => Trip.find(),
    trip: async (_: any, { id }: { id: string }) => Trip.findById(id),
  },

  Mutation: {
    addProfile: async (_: any, { input }: { input: { name: string; email: string; password: string } }) => {
      const existing = await Profile.findOne({ email: input.email });
      if (existing) {
        throw new UserInputError('Email already in use', { invalidArgs: ['email'] });
      }
      const profile = await Profile.create(input);
      const token = signToken(profile.name, profile.email, profile._id.toString());
      return { token, profile };
    },

    login: async (_: any, { email, password }: { email: string; password: string }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw new AuthenticationError('No profile found with this email address');

      const valid = await profile.isCorrectPassword(password);
      if (!valid) throw new AuthenticationError('Incorrect password');

      const token = signToken(profile.name, profile.email, profile._id.toString());
      return { token, profile };
    },

    addTrip: async (_: any, { input }: { input: { name: string; date: string; courseName: string } }, context: Context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');

      const trip = await Trip.create({
        name: input.name,
        date: input.date,
        courses: [{ name: input.courseName }],
      });

      await Profile.findByIdAndUpdate(context.user._id, { $push: { trips: trip._id } });
      return trip;
    },

    deleteTrip: async (_: any, { tripId }: { tripId: string }, context: Context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      await Profile.findByIdAndUpdate(context.user._id, { $pull: { trips: tripId } });
      return Trip.findByIdAndDelete(tripId);
    },

    addCourseToTrip: async (_: any, { tripId, courseName }: { tripId: string; courseName: string }) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      ),

    removeCourseFromTrip: async (_: any, { courseName }: { courseName: string }) =>
      Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      ),

    addPlayer: async (_: any, { tripId, name }: { tripId: string; name: string }) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $addToSet: { players: { name, scores: [] } } },
        { new: true, runValidators: true }
      ),

    removePlayer: async (_: any, { tripId, name }: { tripId: string; name: string }) =>
      Trip.findByIdAndUpdate(
        tripId,
        { $pull: { players: { name } } },
        { new: true }
      ),

    updateScore: async (
      _: any,
      { tripId, player, hole, score }: { tripId: string; player: string; hole: number; score: number }
    ) => {
      const trip = await Trip.findById(tripId);
      if (!trip) throw new Error('Trip not found');

      const playerObj = trip.players?.find(p => p.name === player);
      if (!playerObj) throw new Error('Player not found');

      const existingScore = playerObj.scores.find(s => s.hole === hole);
      if (existingScore) {
        existingScore.score = score;
      } else {
        playerObj.scores.push({ hole, score });
      }

      await trip.save();
      return trip;
    },
  },
};

export default resolvers;
