// server/src/seeds/seed.ts

import { connectDatabase } from '../config/connection'; // Note; Named export for database connection
import Profile from '../models/Profile';                // Note; Mongoose Profile model
import profileSeeds from './profileData.json';          // Note; Raw profile data JSON
import cleanDB from './cleanDB';                        // Note; Utility to clear all collections

/**
 * Note; Main seed function
 * 1. Connect to MongoDB
 * 2. Clean existing data
 * 3. Insert profile seeds
 */
const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Connecting to database...');
    await connectDatabase();                           // Note; connectDatabase()

    console.log('🧹 Cleaning database...');
    await cleanDB();                                   // Note; purge all collections

    console.log(`📦 Seeding ${profileSeeds.length} profiles...`);
    await Profile.insertMany(profileSeeds);            // Note; pre-save hook hashes passwords

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error: unknown) {
    console.error(
      error instanceof Error
        ? `❌ Error seeding database: ${error.message}`
        : '❌ Unknown error during seeding'
    );
    process.exit(1);
  }
};

seedDatabase();
