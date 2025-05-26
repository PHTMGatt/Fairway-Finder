// server/src/models/Profile.ts

import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * Note; Interface for a user profile document, including helper methods.
 */
export interface ProfileDoc extends Document {
  name: string;
  email: string;
  password: string;
  trips: Types.ObjectId[];  
  isCorrectPassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Note; Schema definition for user profiles.
 *       Includes name, email, hashed password, and referenced trips.
 */
const profileSchema = new Schema<ProfileDoc>(
  {
    name: {
      type: String,
      required: true,      // Note; Username is mandatory
      unique: true,        // Note; Prevent duplicate usernames
      trim: true,          // Note; Remove surrounding whitespace
    },
    email: {
      type: String,
      required: true,      // Note; Email is mandatory
      unique: true,        // Note; Prevent duplicate emails
      match: [/.+@.+\..+/, 'Must match a valid email address'],
    },
    password: {
      type: String,
      required: true,      // Note; Password is mandatory
      minlength: 5,        // Note; Enforce minimum length
    },
    trips: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Trip',       // Note; References the Trip model
      },
    ],
  },
  {
    timestamps: true,      // Note; Adds createdAt and updatedAt fields
    toJSON: {              // Note; Ensure virtuals and getters are applied in JSON
      virtuals: false,
      getters: true,
    },
    toObject: {
      virtuals: false,
      getters: true,
    },
  }
);

/**
 * Note; Pre-save middleware to hash password before storing.
 */
profileSchema.pre<ProfileDoc>('save', async function (next) {
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
profileSchema.methods.isCorrectPassword = function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Note; Create and export the Profile model for use in resolvers and routes.
 */
const Profile = model<ProfileDoc>('Profile', profileSchema);
export default Profile;
