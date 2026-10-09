// server/src/config/connection.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI in environment');
}

export async function connectDatabase(): Promise<mongoose.Connection> {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB connected (Fairway-Finder)');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed');
    throw new Error('Database connection failed');
  }
}
