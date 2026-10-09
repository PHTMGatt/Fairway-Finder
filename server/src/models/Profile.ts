// server/src/models/Profile.ts
import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ProfileDoc extends Document {
  name: string;
  email: string;
  password: string;
  trips: Types.ObjectId[];
  handicap?: number;
  isCorrectPassword(candidatePassword: string): Promise<boolean>;
}

const profileSchema = new Schema<ProfileDoc>(
  {
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
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Must match a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      select: false,
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      getters: true,
    },
    toObject: {
      virtuals: false,
      getters: true,
    },
  }
);

profileSchema.pre<ProfileDoc>('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

profileSchema.methods.isCorrectPassword = function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Profile = model<ProfileDoc>('Profile', profileSchema);
export default Profile;
