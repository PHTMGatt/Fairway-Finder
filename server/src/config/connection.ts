// server/src/config/connection.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const rawUri = process.env.MONGODB_URI;
if (!rawUri) {
  throw new Error('Missing MONGODB_URI in environment');
}
const uri: string = rawUri;

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
