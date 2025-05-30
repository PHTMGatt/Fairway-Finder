// server/src/config/connection.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Load environment variables from server/.env
dotenv.config();
// Grab MONGODB_URI and ensure it’s defined
const rawUri = process.env.MONGODB_URI;
if (!rawUri) {
    throw new Error('❌ Missing MONGODB_URI in environment');
}
// Now that we’ve thrown if undefined, cast to string
const uri = rawUri;
export async function connectDatabase() {
    try {
        console.log(`🔗 Connecting to MongoDB at ${uri}`);
        // No more deprecated options, and uri is guaranteed string
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected (Fairway-Finder)');
        return mongoose.connection;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw new Error('Database connection failed');
    }
}
