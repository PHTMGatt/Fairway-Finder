import { Profile } from '../models/index.js';

const cleanDB = async (): Promise<void> => {
  try {
    await Profile.deleteMany({});
    console.log('Profile collection cleaned.');

  } catch (err) {
    console.error('Error cleaning collections:', err);
    process.exit(1);
  }
};

export default cleanDB;
