import mongoose from 'mongoose';
import { connectDatabase } from '../config/connection.js';
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import {
  analyzeTripDataIntegrity,
  analyzeTripReferenceIntegrity,
} from '../utils/dbIntegrity.js';

const main = async () => {
  await connectDatabase();

  const [profiles, trips] = await Promise.all([
    Profile.find({}).select('_id trips').lean(),
    Trip.find({})
      .select('_id date courses.name courses.source courses.providerId courses.location courses.rating courses.slope')
      .lean(),
  ]);

  const report = {
    references: analyzeTripReferenceIntegrity(profiles, trips),
    tripData: analyzeTripDataIntegrity(trips),
  };

  console.log('Fairway Finder database integrity report (read-only)');
  console.log(JSON.stringify(report, null, 2));
};

main()
  .catch(() => {
    console.error('Database integrity check failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
