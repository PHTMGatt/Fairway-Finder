// server/src/seeds/seed.ts

import { connectDatabase } from '../config/connection'; // Database connection
import Profile from '../models/Profile';                // Mongoose model
import profileSeeds from './profileData.json' assert { type: 'json' };
import cleanDB from './cleanDB';                        // DB cleanup utility
import { describeMongoTarget } from '../utils/dbTarget';

// Note; Seeding wipes every Profile, Trip and Course, so only allow it against a local database
const assertSafeSeedTarget = (): void => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed with NODE_ENV=production');
  }

  const { host, isLocal } = describeMongoTarget(process.env.MONGODB_URI);
  if (!isLocal && process.env.ALLOW_REMOTE_SEED !== 'true') {
    throw new Error(
      `Refusing to seed non-local database host "${host}" (set ALLOW_REMOTE_SEED=true to override)`
    );
  }
};

const seedDatabase = async (): Promise<void> => {
  try {
    assertSafeSeedTarget();

    console.log('🌱 Connecting to database...');
    await connectDatabase();

    console.log('🧹 Cleaning database...');
    await cleanDB();

    console.log(`📦 Seeding ${profileSeeds.length} profiles...`);
    // Note; create() runs the pre('save') hook so seeded passwords are bcrypt-hashed (insertMany skips it)
    await Profile.create(profileSeeds);

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
