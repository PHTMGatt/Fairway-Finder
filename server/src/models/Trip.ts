import { Schema, model, Document, Types } from 'mongoose';

/**
 * Note; Subdocument for a golf course within a trip, now caching rating & slope
 */
export interface CourseSubdoc {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  location?: { lat: number; lng: number };
  rating?: number;  //Note; cached courseRating
  slope?: number;   //Note; cached slopeRating
}

/**
 * Note; Subdocument for an individual hole score
 */
export interface ScoreSubdoc {
  hole: number;
  score: number;
}

/**
 * Note; Subdocument for a player’s scorecard entry
 */
export interface PlayerSubdoc {
  name: string;
  scores: ScoreSubdoc[];
}

/**
 * Note; Interface for a Trip document in MongoDB
 */
export interface TripDoc extends Document {
  name: string;
  date: string;
  courses: CourseSubdoc[];
  players: PlayerSubdoc[];
  handicap?: number;        //Note; stored handicap index
  createdAt: Date;
  updatedAt: Date;
}

//Note; Course schema with rating & slope fields
const courseSchema = new Schema<CourseSubdoc>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    rating: { type: Number, default: null }, //Note; courseRating cache
    slope: { type: Number, default: null },  //Note; slopeRating cache
  },
  { _id: true }
);

//Note; Score schema without its own _id
const scoreSchema = new Schema<ScoreSubdoc>(
  {
    hole: { type: Number, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

//Note; Player schema embedding score schema
const playerSchema = new Schema<PlayerSubdoc>(
  {
    name: { type: String, required: true, trim: true },
    scores: { type: [scoreSchema], default: [] },
  },
  { _id: false }
);

//Note; Main Trip schema with courses, players, and handicap field
const tripSchema = new Schema<TripDoc>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    courses: { type: [courseSchema], default: [] },
    players: { type: [playerSchema], default: [] },
    handicap: { type: Number, default: null },   //Note; store computed index
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Note; Create and export the Trip model
const Trip = model<TripDoc>('Trip', tripSchema);
export default Trip;
