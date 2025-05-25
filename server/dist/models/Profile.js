// server/src/models/Profile.ts
import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
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
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
});
// Hash password before saving
profileSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});
// Method to validate password
profileSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
const Profile = model('Profile', profileSchema);
export default Profile;
