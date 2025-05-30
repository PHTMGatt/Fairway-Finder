// server/src/models/Profile.ts
import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
/**
 * Note; Schema definition for user profiles.
 */
const profileSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+@.+\..+/, 'Must match a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
    },
    trips: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Trip',
        },
    ],
    handicap: {
        type: Number,
        default: null,
    },
}, {
    timestamps: true,
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
 */
profileSchema.methods.isCorrectPassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
/**
 * Note; Create and export the Profile model.
 */
const Profile = model('Profile', profileSchema);
export default Profile;
