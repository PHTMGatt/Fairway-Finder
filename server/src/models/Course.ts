// server/src/models/Course.ts

import { Schema, model, Document } from 'mongoose'

/**
 * Note; Interface for a golf course document, including geo-coordinates.
 */
export interface CourseDoc extends Document {
  name: string
  address: string
  rating: number | null
  place_id: string
  location: { lat: number; lng: number } | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Note; Define Course schema with timestamps and geospatial index.
 */
const courseSchema = new Schema<CourseDoc>(
  {
    name: {
      type: String,
      required: true,   // Note; Course name is mandatory
      trim: true,       // Note; Automatically trim whitespace
    },
    address: {
      type: String,
      required: true,   // Note; Course address is mandatory
      trim: true,
    },
    rating: {
      type: Number,
      default: null,    // Note; Some courses may not have a rating yet
    },
    place_id: {
      type: String,
      required: true,   // Note; Unique Google Place ID
      unique: true,
      index: true,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  {
    timestamps: true,   // Note; adds createdAt & updatedAt
  }
)

/**
 * Note; Create a compound index on location for geo-queries.
 */
courseSchema.index({ 'location.lat': 1, 'location.lng': 1 })

/**
 * Note; Export the Mongoose model for use in resolvers and route handlers.
 */
const Course = model<CourseDoc>('Course', courseSchema)
export default Course
