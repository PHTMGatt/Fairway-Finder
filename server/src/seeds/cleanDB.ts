import { Profile, Trip, Course } from '../models/index.js';

const cleanDB = async (): Promise<void> => {
  try {
    await Profile.deleteMany({});
    await Trip.deleteMany({});
    await Course.deleteMany({});

    console.log('🧹 Collections cleaned: Profile, Trip, Course');
  } catch (err) {
    console.error('❌ Error cleaning collections:', err);
    process.exit(1);
  }
};

export default cleanDB;
