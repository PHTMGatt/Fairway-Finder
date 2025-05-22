import { Profile, Trip } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
const resolvers = {
    Query: {
        // Note; Fetch all profiles with their trips populated
        profiles: async () => {
            return await Profile.find().populate('trips');
        },
        // Note; Fetch a single profile by ID with trips populated
        profile: async (_, { profileId }) => {
            return await Profile.findById(profileId).populate('trips');
        },
        // Note; Fetch current user's profile; require authentication
        me: async (_, __, context) => {
            if (!context.user)
                throw AuthenticationError;
            return await Profile.findById(context.user._id).populate('trips');
        },
        // Note; Fetch all trips without population
        trips: async () => {
            return await Trip.find();
        },
        // Note; Fetch a single trip by ID
        trip: async (_, { id }) => {
            return await Trip.findById(id);
        },
    },
    Mutation: {
        // Note; Register a new profile and return auth token
        addProfile: async (_, { input }) => {
            const profile = await Profile.create(input);
            const token = signToken(profile.name, profile.email, String(profile._id));
            return { token, profile };
        },
        // Note; Authenticate user credentials and return auth token
        login: async (_, { email, password }) => {
            const profile = await Profile.findOne({ email });
            if (!profile)
                throw AuthenticationError;
            const isValid = await profile.isCorrectPassword(password);
            if (!isValid)
                throw AuthenticationError;
            const token = signToken(profile.name, profile.email, String(profile._id));
            return { token, profile };
        },
        // Note; Create a new trip for authenticated user
        addTrip: async (_, { name }, context) => {
            if (!context.user)
                throw AuthenticationError;
            const trip = await Trip.create({ name });
            await Profile.findByIdAndUpdate(context.user._id, {
                $push: { trips: trip._id },
            });
            return trip;
        },
        // Note; Add a course entry to a specific trip
        addCourseToTrip: async (_, { tripId, courseName }) => {
            return await Trip.findByIdAndUpdate(tripId, { $push: { courses: { name: courseName } } }, { new: true, runValidators: true });
        },
        // Note; Remove a course from any trip by course name
        removeCourseFromTrip: async (_, { courseName }) => {
            return await Trip.findOneAndUpdate({ 'courses.name': courseName }, { $pull: { courses: { name: courseName } } }, { new: true });
        },
        // Note; Add a skill to a profile's skill set (no duplicates)
        addSkill: async (_, { profileId, skill }, context) => {
            if (!context.user)
                throw AuthenticationError;
            return await Profile.findByIdAndUpdate(profileId, { $addToSet: { skills: skill } }, { new: true, runValidators: true });
        },
        // Note; Remove a skill from the authenticated user's profile
        removeSkill: async (_, { skill }, context) => {
            if (!context.user)
                throw AuthenticationError;
            return await Profile.findByIdAndUpdate(context.user._id, { $pull: { skills: skill } }, { new: true });
        },
    },
};
export default resolvers;
