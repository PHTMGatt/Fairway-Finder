import db from '../config/connection.js';
import { Profile } from '../models/index.js';
import profileSeeds from './profileData.json' with { type: 'json' };
import cleanDB from './cleanDB.js';

// Seed the database with profile data
const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Connecting to database...');
    await db();

    console.log('🧹 Cleaning database...');
    await cleanDB();

    console.log(`📦 Seeding ${profileSeeds.length} profiles...`);
    await Profile.insertMany(profileSeeds);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error seeding database:', error.message);
    } else {
      console.error('❌ Unknown error during seed');
    }
    process.exit(1);
  }
};

seedDatabase();
