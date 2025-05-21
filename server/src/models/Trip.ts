import { Schema, model, Types, Document } from 'mongoose';

// Interface for a Course embedded in a Trip
interface ICourse {
  _id?: Types.ObjectId;
  name: string;
}

// Interface for the Trip document
export interface ITrip extends Document {
  name: string;
  courses: ICourse[];
}

// Schema for embedded course
const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
  },
  { _id: true } // Ensures each course in the array has its own _id
);

// Trip schema
const tripSchema = new Schema<ITrip>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    courses: [courseSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Trip = model<ITrip>('Trip', tripSchema);
export default Trip;
