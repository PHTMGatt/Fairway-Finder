import { Schema, model, Document } from 'mongoose';

// Note; Interface for Course document, extending Mongoose’s Document
export interface ICourse extends Document {
  name: string;
}

// Note; Define schema for Course with timestamps
const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,   // Note; Course name is mandatory
      trim: true,       // Note; Automatically trim whitespace
    },
  },
  {
    timestamps: true,   // Note; Mongoose will add createdAt and updatedAt fields
  }
);

// Note; Create and export the Course model based on the schema
const Course = model<ICourse>('Course', courseSchema);
export default Course;
