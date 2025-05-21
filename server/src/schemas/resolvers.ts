import { Profile, Trip } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

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
    // Get all profiles
    profiles: async () => {
      return await Profile.find().populate('trips');
    },

    // Get profile by ID
    profile: async (_: any, { profileId }: { profileId: string }) => {
      return await Profile.findById(profileId).populate('trips');
    },

    // Get logged-in user's profile
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) throw AuthenticationError;
      return await Profile.findById(context.user._id).populate('trips');
    },

    // Get all trips
    trips: async () => {
      return await Trip.find();
    },

    // Get a single trip by ID
    trip: async (_: any, { id }: { id: string }) => {
      return await Trip.findById(id);
    },
  },

  Mutation: {
    // Signup
    addProfile: async (_: any, { input }: AddProfileArgs) => {
      const profile = await Profile.create(input);
      const token = signToken(profile.name, profile.email, profile._id);
      return { token, profile };
    },

    // Login
    login: async (_: any, { email, password }: { email: string; password: string }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw AuthenticationError;

      const isValid = await profile.isCorrectPassword(password);
      if (!isValid) throw AuthenticationError;

      const token = signToken(profile.name, profile.email, profile._id);
      return { token, profile };
    },

    // Add a trip
    addTrip: async (_: any, { name }: { name: string }, context: Context) => {
      if (!context.user) throw AuthenticationError;

      const trip = await Trip.create({ name });
      await Profile.findByIdAndUpdate(context.user._id, {
        $push: { trips: trip._id },
      });

      return trip;
    },

    // Add course to a trip
    addCourseToTrip: async (_: any, { tripId, courseName }: { tripId: string; courseName: string }) => {
      return await Trip.findByIdAndUpdate(
        tripId,
        { $push: { courses: { name: courseName } } },
        { new: true, runValidators: true }
      );
    },

    // Remove course by name
    removeCourseFromTrip: async (_: any, { courseName }: { courseName: string }) => {
      return await Trip.findOneAndUpdate(
        { 'courses.name': courseName },
        { $pull: { courses: { name: courseName } } },
        { new: true }
      );
    },

    // Optional - Add skill
    addSkill: async (_: any, { profileId, skill }: { profileId: string; skill: string }, context: Context) => {
      if (!context.user) throw AuthenticationError;

      return await Profile.findByIdAndUpdate(
        profileId,
        { $addToSet: { skills: skill } },
        { new: true, runValidators: true }
      );
    },

    // Optional - Remove skill
    removeSkill: async (_: any, { skill }: { skill: string }, context: Context) => {
      if (!context.user) throw AuthenticationError;

      return await Profile.findByIdAndUpdate(
        context.user._id,
        { $pull: { skills: skill } },
        { new: true }
      );
    },
  },
};

export default resolvers;
