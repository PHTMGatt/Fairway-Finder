import { Schema, model, Types, Document } from 'mongoose';

// Note; Interface for a Course embedded within a Trip
interface ICourse {
  _id?: Types.ObjectId; // Note; MongoDB ObjectId (auto-generated) for each course entry
  name: string;         // Note; Name of the golf course
}

// Note; Interface for the Trip document, extending Mongoose’s Document
export interface ITrip extends Document {
  name: string;     // Note; Name of the trip
  courses: ICourse[]; // Note; Array of embedded course documents
}

// Note; Schema for embedded Course, with its own _id
const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true }, // Note; Course name is mandatory
  },
  { _id: true } // Note; Ensure each embedded course gets a unique _id
);

// Note; Trip schema definition
const tripSchema = new Schema<ITrip>(
  {
    name: {
      type: String,
      required: true, // Note; Trip must have a name
      trim: true,     // Note; Trim whitespace around the name
    },
    courses: [courseSchema], // Note; Embed multiple courses per trip
  },
  {
    timestamps: true,           // Note; Adds createdAt and updatedAt fields
    toJSON: { virtuals: true }, // Note; Include virtuals in JSON output
    toObject: { virtuals: true }, // Note; Include virtuals in object output
  }
);

// Note; Create and export the Trip model
const Trip = model<ITrip>('Trip', tripSchema);
export default Trip;
