// server/src/resolvers/index.ts
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import { signToken } from '../utils/auth.js';
import { AuthenticationError, UserInputError } from 'apollo-server-errors';
const resolvers = {
    Query: {
        //Note; Fetch all profiles (with their trips)
        profiles: async () => Profile.find().populate('trips'),
        //Note; Fetch one profile by ID
        profile: async (_p, { profileId }) => Profile.findById(profileId).populate('trips'),
        //Note; “me” query uses context.user
        me: async (_p, _a, context) => {
            if (!context.user)
                throw new AuthenticationError('Not authenticated');
            return Profile.findById(context.user._id).populate('trips');
        },
        //Note; Fetch all trips
        trips: async () => Trip.find(),
        //Note; Fetch single trip by ID and reshape scorecard + include handicap
        trip: async (_p, { id }) => {
            const trip = await Trip.findById(id);
            if (!trip)
                return null;
            // reshape players
            const transformedPlayers = trip.players.map((p) => {
                const ordered = Array.from({ length: 18 }, (_, idx) => {
                    const holeNum = idx + 1;
                    const found = p.scores.find((s) => s.hole === holeNum);
                    return { hole: holeNum, score: found?.score ?? 0 };
                });
                let total = 0;
                const scoreObj = {};
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
        addProfile: async (_p, { input }) => {
            const existing = await Profile.findOne({ email: input.email });
            if (existing) {
                throw new UserInputError('Email already in use', {
                    invalidArgs: ['email'],
                });
            }
            const profile = await Profile.create(input);
            const token = signToken(profile.name, profile.email, profile._id);
            return { token, profile };
        },
        //Note; Login an existing profile
        login: async (_p, { email, password }) => {
            const profile = await Profile.findOne({ email });
            if (!profile)
                throw new AuthenticationError('No profile found');
            const valid = await profile.isCorrectPassword(password);
            if (!valid)
                throw new AuthenticationError('Incorrect password');
            const token = signToken(profile.name, profile.email, profile._id);
            return { token, profile };
        },
        //Note; Create a new trip for current user
        addTrip: async (_p, { input }, context) => {
            if (!context.user)
                throw new AuthenticationError('Not authenticated');
            const userId = context.user._id;
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
        deleteTrip: async (_p, { tripId }, context) => {
            if (!context.user)
                throw new AuthenticationError('Not authenticated');
            const userId = context.user._id;
            await Profile.findByIdAndUpdate(userId, {
                $pull: { trips: tripId },
            });
            return Trip.findByIdAndDelete(tripId);
        },
        //Note; Add a course to a trip
        addCourseToTrip: async (_p, { tripId, courseName }) => Trip.findByIdAndUpdate(tripId, { $push: { courses: { name: courseName } } }, { new: true, runValidators: true }),
        //Note; Remove a course from a trip
        removeCourseFromTrip: async (_p, { courseName }) => Trip.findOneAndUpdate({ 'courses.name': courseName }, { $pull: { courses: { name: courseName } } }, { new: true }),
        //Note; Add a player with 18 zeroed scores
        addPlayer: async (_p, { tripId, name }) => {
            const fullScores = Array.from({ length: 18 }, (_, i) => ({
                hole: i + 1,
                score: 0,
            }));
            return Trip.findByIdAndUpdate(tripId, { $push: { players: { name, scores: fullScores } } }, { new: true, runValidators: true });
        },
        //Note; Remove a player
        removePlayer: async (_p, { tripId, name }) => Trip.findByIdAndUpdate(tripId, { $pull: { players: { name } } }, { new: true }),
        //Note; Update (or add) a score entry
        updateScore: async (_p, { tripId, player, hole, score, }) => {
            const trip = await Trip.findById(tripId);
            if (!trip)
                throw new UserInputError('Trip not found');
            const playerObj = trip.players.find((p) => p.name === player);
            if (!playerObj)
                throw new UserInputError('Player not found');
            const existing = playerObj.scores.find((s) => s.hole === hole);
            if (existing) {
                existing.score = score;
            }
            else {
                playerObj.scores.push({ hole, score });
            }
            await trip.save();
            return trip;
        },
        //Note; New mutation to persist computed handicap
        updateTripHandicap: async (_p, { tripId, handicap }, context) => {
            if (!context.user)
                throw new AuthenticationError('Not authenticated');
            //Note; ensure user owns this trip
            const profile = await Profile.findById(context.user._id);
            if (!profile?.trips.includes(tripId)) {
                throw new AuthenticationError('Not your trip');
            }
            const updated = await Trip.findByIdAndUpdate(tripId, { handicap }, { new: true, runValidators: true });
            if (!updated)
                throw new UserInputError('Trip not found');
            return updated;
        },
    },
};
export default resolvers;
