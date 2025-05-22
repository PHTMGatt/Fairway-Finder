// server/src/schemas/resolvers.ts

import { Profile, Trip } from '../models/index.js';
import { signToken } from '../utils/auth.js';
import { AuthenticationError, UserInputError } from '@apollo/server/errors';

interface ProfileType {
  _id: string;
  name: string;
  email: string;
  password: string;
  skills?: string[];
}

interface AddProfileArgs {
  input: {
    name: string;
    email: string;
    password: string;
  };
}

interface Context {
  user?: ProfileType;
}

const resolvers = {
  Query: {
    profiles: async () => {
      return await Profile.find().populate('trips');
    },

    profile: async (_: any, { profileId }: { profileId: string }) => {
      return await Profile.findById(profileId).populate('trips');
    },

    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await Profile.findById(context.user._id).populate('trips');
    },

    trips: async () => {
      return await Trip.find();
    },

    trip: async (_: any, { id }: { id: string }) => {
      return await Trip.findById(id);
    },
  },

  Mutation: {
    addProfile: async (_: any, { input }: AddProfileArgs) => {
      // Prevent duplicate emails
      const existing = await Profile.findOne({ email: input.email });
      if (existing) {
        throw new UserInputError('Email already in use', {
          invalidArgs: ['email'],
        });
      }

      const profile = await Profile.create(input);
      const token = signToken(
        profile.name,
        profile.email,
        profile._id.toString()
      );
      return { token, profile };
    },

    login: async (
      _: any,
      { email, password }: { email: string; password: string }
    ) => {
      const profile = await Profile.findOne({ email });
      if (!profile) {
        throw new AuthenticationError(
          'No profile found with this email address'
        );
      }

      const valid = await profile.isCorrectPassword(password);
      if (!valid) {
        throw new AuthenticationError('Incorrect password');
      }

      const token = signToken(
        profile.name,
        profile.email,
        profile._id.toString()
      );
      return { token, profile };
    },

    addTrip: async (_: any, { name }: { name: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      const trip = await Trip.create({ name });
      await Profile.findByIdAndUpdate(context.user._id, {
        $push: { trips: trip._id },
      });
      return trip;
    },

    addCourseToTrip: async (
      _: any,
      { tripId, courseName }: { tripId: string; courseName: string }
    ) => {
      return await Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );
    },

    removeCourseFromTrip: async (
      _: any,
      { courseName }: { courseName: string }
    ) => {
      return await Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      );
    },

    addSkill: async (
      _: any,
      { profileId, skill }: { profileId: string; skill: string },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await Profile.findByIdAndUpdate(
        profileId,
        { $addToSet: { skills: skill } },
        { new: true, runValidators: true }
      );
    },

    removeSkill: async (_: any, { skill }: { skill: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await Profile.findByIdAndUpdate(
        context.user._id,
        { $pull: { skills: skill } },
        { new: true }
      );
    },
  },
};

export default resolvers;
