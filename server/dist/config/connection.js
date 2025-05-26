// server/src/config/connection.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Load environment variables from server/.env
dotenv.config();
// Note; MongoDB connection URI loaded from environment.
// Throws if not defined to avoid silent failures.
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
}
/**
 * Note; Establishes a connection to MongoDB using Mongoose.
 * @returns The active mongoose.Connection
 * @throws If the connection attempt fails
 */
export async function connectDatabase() {
    try {
        console.log(`🔗 Connecting to MongoDB at ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected (Fairway-Finder)');
        return mongoose.connection;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw new Error('Database connection failed');
    }
}
