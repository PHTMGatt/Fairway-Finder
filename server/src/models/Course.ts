import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
}

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course = model<ICourse>('Course', courseSchema);
export default Course;
