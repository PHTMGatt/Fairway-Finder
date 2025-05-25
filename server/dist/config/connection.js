import dotenv from 'dotenv';
import mongoose from 'mongoose';
// Load env vars from .env
dotenv.config();
// Use Fairway-Finder DB URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Fairway-Finder';
/**
 * Connects to MongoDB (Fairway-Finder only) and returns the active connection
 */
const db = async () => {
    try {
        console.log('🔗 Connecting to MongoDB:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected (Fairway-Finder)');
        return mongoose.connection;
    }
    catch (err) {
        console.error('❌ MongoDB connection failed:', err);
        throw new Error('Database connection failed');
    }
};
export default db;
