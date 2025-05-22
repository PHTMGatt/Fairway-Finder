import db from '../config/connection.js';
import { Profile } from '../models/index.js';
import profileSeeds from './profileData.json'; // Note; Import raw profile data from JSON
import cleanDB from './cleanDB.js'; // Note; Utility to clear existing collections

// Note; Main seed function to connect, clean, and seed the database
const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Connecting to database...');
    await db(); // Note; Establish MongoDB connection

    console.log('🧹 Cleaning database...');
    await cleanDB(); // Note; Remove all existing documents

    console.log(`📦 Seeding ${profileSeeds.length} profiles...`);
    // Note; Insert profiles; passwords will be hashed via pre-save hook
    await Profile.insertMany(profileSeeds);

    console.log('✅ Seeding completed successfully!');
    process.exit(0); // Note; Exit process on success
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error seeding database:', error.message);
    } else {
      console.error('❌ Unknown error during seeding');
    }
    process.exit(1); // Note; Exit process on failure
  }
};

seedDatabase(); // Note; Invoke the seed function
