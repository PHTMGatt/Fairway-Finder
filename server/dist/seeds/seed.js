// server/src/seeds/seed.ts
import { connectDatabase } from '../config/connection'; // Database connection
import Profile from '../models/Profile'; // Mongoose model
import profileSeeds from './profileData.json' assert { type: 'json' };
import cleanDB from './cleanDB'; // DB cleanup utility
const seedDatabase = async () => {
    try {
        console.log('🌱 Connecting to database...');
        await connectDatabase();
        console.log('🧹 Cleaning database...');
        await cleanDB();
        console.log(`📦 Seeding ${profileSeeds.length} profiles...`);
        await Profile.insertMany(profileSeeds);
        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error(error instanceof Error
            ? `❌ Error seeding database: ${error.message}`
            : '❌ Unknown error during seeding');
        process.exit(1);
    }
};
seedDatabase();
