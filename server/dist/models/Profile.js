// server/src/models/Profile.ts
import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
/**
 * Note; Schema definition for user profiles.
 *       Includes name, email, hashed password, and referenced trips.
 */
const profileSchema = new Schema({
    name: {
        type: String,
        required: true, // Note; Username is mandatory
        unique: true, // Note; Prevent duplicate usernames
        trim: true, // Note; Remove surrounding whitespace
    },
    email: {
        type: String,
        required: true, // Note; Email is mandatory
        unique: true, // Note; Prevent duplicate emails
        match: [/.+@.+\..+/, 'Must match a valid email address'],
    },
    password: {
        type: String,
        required: true, // Note; Password is mandatory
        minlength: 5, // Note; Enforce minimum length
    },
    trips: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Trip', // Note; References the Trip model
        },
    ],
}, {
    timestamps: true, // Note; Adds createdAt and updatedAt fields
    toJSON: {
        virtuals: false,
        getters: true,
    },
    toObject: {
        virtuals: false,
        getters: true,
    },
});
/**
 * Note; Pre-save middleware to hash password before storing.
 */
profileSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});
/**
 * Note; Instance method to verify a plaintext password against the stored hash.
 *
 * @param candidatePassword - Plaintext password to verify
 * @returns true if the password matches, false otherwise
 */
profileSchema.methods.isCorrectPassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
/**
 * Note; Create and export the Profile model for use in resolvers and routes.
 */
const Profile = model('Profile', profileSchema);
export default Profile;
