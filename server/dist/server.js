// server/src/server.ts
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
// Note; Create __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Note; Load all environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Note; Destructure and validate critical env vars
const { MONGODB_URI, PORT = '3001', WEATHER_API_KEY, PLACES_API_KEY, JWT_SECRET_KEY, } = process.env;
if (!MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment');
    process.exit(1);
}
if (!WEATHER_API_KEY) {
    console.error('❌ Missing WEATHER_API_KEY in environment');
    process.exit(1);
}
if (!PLACES_API_KEY) {
    console.error('❌ Missing PLACES_API_KEY in environment');
    process.exit(1);
}
if (!JWT_SECRET_KEY) {
    console.error('❌ Missing JWT_SECRET_KEY in environment');
    process.exit(1);
}
console.log(`🔑 Environment loaded:`);
console.log(`  • MongoDB URI: ${MONGODB_URI}`);
console.log(`  • Server Port: ${PORT}`);
console.log(`  • Weather Key: loaded`);
console.log(`  • Places Key: loaded`);
console.log(`  • JWT Secret: loaded`);
// Note; Import database connection utility
import { connectDatabase } from './config/connection.js';
// Note; Import GraphQL schema
import { schema } from './schemas/index.js';
// Note; Import REST route handlers
import courseRoutes from './routes/courseRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
// Note; Import JWT authentication middleware
import { authenticateToken } from './utils/auth.js';
// Note; Import Profile model for dev route
import Profile from './models/Profile.js';
async function startServer() {
    try {
        // Note; Connect to MongoDB
        await connectDatabase();
        // Note; Dev ping to confirm DB connectivity
        const Ping = mongoose.model('Ping', new mongoose.Schema({ name: String }));
        const existing = await Ping.findOne({ name: 'VSCodeCheck' });
        if (!existing) {
            const ping = await Ping.create({ name: 'VSCodeCheck' });
            console.log(`✅ MongoDB test write successful (Ping ID: ${ping._id})`);
        }
        else {
            console.log(`✅ MongoDB already initialized (Ping ID: ${existing._id})`);
        }
        // Note; Initialize Apollo GraphQL server
        const apollo = new ApolloServer({
            typeDefs: schema.typeDefs,
            resolvers: schema.resolvers,
        });
        await apollo.start();
        // Note; Create Express app
        const app = express();
        app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
        app.use(express.json());
        // Note; Mount REST API routes under /api
        app.use('/api', courseRoutes);
        app.use('/api', weatherRoutes);
        app.use('/api', mapRoutes);
        // Note; Dev-only route to clear all users
        app.delete('/api/dev/clear-users', async (_req, res) => {
            try {
                const result = await Profile.deleteMany({});
                res.json({ message: 'All profiles deleted', deletedCount: result.deletedCount });
            }
            catch (err) {
                console.error('[DEV] Failed to clear users:', err);
                res.status(500).json({ error: 'Failed to clear users' });
            }
        });
        // Note; Mount GraphQL endpoint with JWT auth
        app.use('/graphql', expressMiddleware(apollo, {
            context: async ({ req }) => authenticateToken({ req }),
        }));
        // Note; Serve React client in production mode
        if (process.env.NODE_ENV === 'production') {
            const staticPath = path.join(__dirname, '../client/dist');
            app.use(express.static(staticPath));
            app.get('*', (_req, res) => {
                res.sendFile(path.join(staticPath, 'index.html'));
            });
        }
        // Note; Start listening on specified port
        const portNumber = parseInt(PORT, 10) || 3001;
        app.listen(portNumber, () => {
            console.log(`🚀 Server running at http://localhost:${portNumber}`);
        });
    }
    catch (err) {
        console.error('❌ Server startup failed:', err);
        process.exit(1);
    }
}
startServer();
