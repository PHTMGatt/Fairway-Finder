import dotenv from 'dotenv';
// Note; Load environment variables from server/.env
dotenv.config();
import mongoose from 'mongoose';
// Note; Pull MongoDB connection URI from env or fallback to empty string
const MONGODB_URI = process.env.MONGODB_URI || '';
/**
 * Note; Establishes a connection to MongoDB and returns the mongoose connection.
 */
const db = async () => {
    try {
        // Note; Log URI (ensure you’re not logging sensitive data in production)
        console.log('Connecting to MongoDB with URI:', MONGODB_URI);
        // Note; Connect to MongoDB using the URI
        await mongoose.connect(MONGODB_URI);
        console.log('Database connected.');
        return mongoose.connection;
    }
    catch (error) {
        // Note; Log the error and rethrow to be handled by calling code
        console.error('Database connection error:', error);
        throw new Error('Database connection failed.');
    }
};
export default db;
