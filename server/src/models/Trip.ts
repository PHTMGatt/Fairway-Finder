// server/src/models/Trip.ts

import { Schema, model, Types, Document } from 'mongoose';

interface ICourse {
  _id?: Types.ObjectId;
  name: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface IScore {
  hole: number;
  score: number;
}

interface IPlayer {
  name: string;
  scores: IScore[];
}

export interface ITrip extends Document {
  name: string;
  date: string;
  courses: ICourse[];
  players?: IPlayer[];
}

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    address: String,
    location: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: true }
);

const scoreSchema = new Schema<IScore>(
  {
    hole: Number,
    score: Number,
  },
  { _id: false }
);

const playerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true },
    scores: [scoreSchema],
  },
  { _id: false }
);

const tripSchema = new Schema<ITrip>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    courses: [courseSchema],
    players: [playerSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Trip = model<ITrip>('Trip', tripSchema);
export default Trip;
