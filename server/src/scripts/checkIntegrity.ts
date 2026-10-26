import mongoose from 'mongoose';
import { connectDatabase } from '../config/connection.js';
import Profile from '../models/Profile.js';
import Trip from '../models/Trip.js';
import {
  analyzeTripReferenceIntegrity,
  buildDanglingReferenceCleanupPreview,
} from '../utils/dbIntegrity.js';

const main = async () => {
  await connectDatabase();

  const [profiles, trips] = await Promise.all([
    Profile.find({}).select('_id trips').lean(),
    Trip.find({}).select('_id').lean(),
  ]);

  const report = analyzeTripReferenceIntegrity(profiles, trips);
  const cleanupPreview = buildDanglingReferenceCleanupPreview(report);

  console.log('Fairway Finder database integrity report (read-only)');
  console.log(JSON.stringify({ report, cleanupPreview }, null, 2));
};

main()
  .catch(() => {
    console.error('Database integrity check failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
