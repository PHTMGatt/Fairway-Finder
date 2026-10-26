// server/src/models/'Trip.ts'

import { Schema, model, Document, Types } from 'mongoose'

/**
 * Canonical selected-course snapshot embedded in a trip. Provider identity is
 * optional so legacy name-only trips remain readable while new trips can keep
 * the exact course the user selected instead of rediscovering it by name.
 */
export interface CourseSubdoc {
  _id: Types.ObjectId
  name: string
  source?: string
  providerId?: string
  address?: string
  location?: { lat: number; lng: number }
  rating?: number | null
  golfCourseApiId?: string
  courseRating?: number | null
  slope?: number | null
}

/**
 * Note; Subdocument for an individual hole score
 */
export interface ScoreSubdoc {
  hole: number
  score: number
}

/**
 * Note; Subdocument for a player’s scorecard entry
 */
export interface PlayerSubdoc {
  name: string
  scores: ScoreSubdoc[]
  handicap?: number
}

/**
 * Note; Interface for a Trip document in MongoDB
 */
export interface TripDoc extends Document {
  name: string
  date: string
  courses: CourseSubdoc[]
  players: PlayerSubdoc[]
  handicap?: number
  isGuest?: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new Schema<CourseSubdoc>(
  {
    name: { type: String, required: true, trim: true },
    source: { type: String, trim: true },
    providerId: { type: String, trim: true },
    address: { type: String, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    // Note; Provider/display rating (for example Google Places stars).
    rating: { type: Number, default: null },
    // Note; Stable GolfCourseAPI identity when that provider has been resolved.
    golfCourseApiId: { type: String, trim: true },
    // Note; Tee/course rating used for handicap calculations; distinct from display rating.
    courseRating: { type: Number, default: null },
    slope: { type: Number, default: null },
  },
  { _id: true }
)

const scoreSchema = new Schema<ScoreSubdoc>(
  {
    hole: { type: Number, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
)

const playerSchema = new Schema<PlayerSubdoc>(
  {
    name: { type: String, required: true, trim: true },
    scores: { type: [scoreSchema], default: [] },
    handicap: { type: Number, default: null },
  },
  { _id: false }
)

const tripSchema = new Schema<TripDoc>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    courses: { type: [courseSchema], default: [] },
    players: { type: [playerSchema], default: [] },
    handicap: { type: Number, default: null },
    isGuest: { type: Boolean },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// The first course is the trip's canonical location/context for routing and weather.
// New trips can establish it, and later saves can edit secondary courses, but an
// existing Trip cannot silently delete or replace its primary course.
tripSchema.pre('save', async function () {
  if (this.isNew || !this.isModified('courses')) return

  const persisted = await this.model('Trip')
    .findById(this._id)
    .select('courses._id')
    .lean<{ courses?: Array<{ _id: Types.ObjectId }> }>()

  const persistedPrimaryId = persisted?.courses?.[0]?._id?.toString()
  if (!persistedPrimaryId) return

  const currentPrimaryId = this.courses?.[0]?._id?.toString()
  if (currentPrimaryId !== persistedPrimaryId) {
    throw new Error('The primary course cannot be removed from a trip')
  }
})

// Note; TTL index: MongoDB deletes a guest trip once expiresAt passes. Only isGuest trips are
// considered, so a permanent trip is never deleted even if it has an expiresAt.
tripSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isGuest: true } }
)

const Trip = model<TripDoc>('Trip', tripSchema)
export default Trip
