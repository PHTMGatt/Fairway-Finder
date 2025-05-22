import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
// Note; Define Profile schema with validation and constraints
const profileSchema = new Schema({
    name: {
        type: String,
        required: true, // Note; Name is required
        unique: true, // Note; No duplicate usernames
        trim: true, // Note; Trim whitespace
    },
    email: {
        type: String,
        required: true, // Note; Email is required
        unique: true, // Note; No duplicate emails
        match: [/.+@.+\..+/, 'Must match an email address!'], // Note; Validate format
    },
    password: {
        type: String,
        required: true, // Note; Password is required
        minlength: 5, // Note; Enforce minimum length
    },
    skills: [
        {
            type: String,
            trim: true, // Note; Trim each skill entry
        },
    ],
}, {
    timestamps: true, // Note; Adds createdAt and updatedAt
    toJSON: { getters: true }, // Note; Apply getters on toJSON
    toObject: { getters: true }, // Note; Apply getters on toObject
});
// Note; Hash password before saving new or modified documents
profileSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});
// Note; Method to compare provided password with stored hashed password
profileSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
// Note; Create and export Profile model
const Profile = model('Profile', profileSchema);
export default Profile;
