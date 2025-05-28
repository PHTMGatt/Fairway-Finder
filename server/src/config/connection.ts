// server/src/config/connection.ts

import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from server/.env
dotenv.config();

// ✅ Cast after null check to satisfy TypeScript
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('❌ Missing MONGODB_URI in environment');
}

/**
 * ✅ Establishes a connection to MongoDB using Mongoose.
 */
export async function connectDatabase(): Promise<mongoose.Connection> {
  try {
    console.log(`🔗 Connecting to MongoDB at ${uri}`);
    await mongoose.connect(uri as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    console.log('✅ MongoDB connected (Fairway-Finder)');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw new Error('Database connection failed');
  }
}
