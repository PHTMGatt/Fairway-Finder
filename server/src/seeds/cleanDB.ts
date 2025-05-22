import { Profile, Trip, Course } from '../models/index.js';

// Note; Utility to clear all documents from Profile, Trip, and Course collections
const cleanDB = async (): Promise<void> => {
  try {
    // Note; Remove all profiles
    await Profile.deleteMany({});
    // Note; Remove all trips
    await Trip.deleteMany({});
    // Note; Remove all courses
    await Course.deleteMany({});

    console.log('🧹 Collections cleaned: Profile, Trip, Course');
  } catch (err) {
    // Note; Log error and exit process on failure
    console.error('❌ Error cleaning collections:', err);
    process.exit(1);
  }
};

export default cleanDB;
