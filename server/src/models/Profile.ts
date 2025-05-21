import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// 1️⃣ Define the structure of a Profile document
export interface IProfile extends Document {
  name: string;
  email: string;
  password: string;
  skills: string[];
  isCorrectPassword(password: string): Promise<boolean>;
}

// 2️⃣ Create schema with validation and constraints
const profileSchema = new Schema<IProfile>(
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
      match: [/.+@.+\..+/, 'Must match an email address!'],
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// 3️⃣ Hash the password before saving (create or update)
profileSchema.pre<IProfile>('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

// 4️⃣ Add method for password comparison
profileSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// 5️⃣ Export model
const Profile = model<IProfile>('Profile', profileSchema);
export default Profile;
