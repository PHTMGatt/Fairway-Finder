//server\server.ts
// Note; Core module imports and Apollo server dependencies
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
// Note; Load environment variables from the .env file
dotenv.config({
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
});
// Note; Destructure required configuration values
const { MONGODB_URI, PORT = '3001', WEATHER_API_KEY, PLACES_API_KEY, JWT_SECRET_KEY, NODE_ENV = 'development', } = process.env;
// Note; Validate presence of critical environment variables
if (!MONGODB_URI || !WEATHER_API_KEY || !PLACES_API_KEY || !JWT_SECRET_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}
// Note; Log configuration for development debugging
if (NODE_ENV !== 'production') {
    console.log(`🔑 Environment loaded:
  • MongoDB URI: ${MONGODB_URI}
  • Server Port: ${PORT}
  • Weather Key: loaded
  • Places Key: loaded
  • JWT Secret: loaded`);
}
// Note; Import application modules: database connection, schema, routes, models, auth util
import { connectDatabase } from './config/connection.js';
import { schema } from './schemas/index.js';
import courseRoutes from './routes/courseRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import golfRoutes from './routes/golfRoutes.js';
import Profile from './models/Profile.js';
import { authenticateToken } from './utils/auth.js';
// Note; Main server startup function
async function startServer() {
    try {
        // Note; Connect to MongoDB
        await connectDatabase();
        // Note; In development, perform a test write/read to confirm DB connectivity
        if (NODE_ENV !== 'production') {
            const Ping = mongoose.model('Ping', new mongoose.Schema({ name: String }));
            const existing = await Ping.findOne({ name: 'VSCodeCheck' });
            if (!existing) {
                const ping = await Ping.create({ name: 'VSCodeCheck' });
                console.log(`✅ MongoDB test write successful (Ping ID: ${ping._id})`);
            }
            else {
                console.log(`✅ MongoDB already initialized (Ping ID: ${existing._id})`);
            }
        }
        // Note; Initialize Apollo GraphQL server
        const apollo = new ApolloServer({
            typeDefs: schema.typeDefs,
            resolvers: schema.resolvers,
        });
        await apollo.start();
        // Note; Initialize Express application
        const app = express();
        app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
        app.use(express.json());
        app.use(compression());
        // Note; Register REST API routes
        app.use('/api', courseRoutes);
        app.use('/api', weatherRoutes);
        app.use('/api', mapRoutes);
        app.use('/api', golfRoutes); // ✅ Register new GolfCourseAPI proxy route
        // Note; Development-only route to clear all user profiles
        if (NODE_ENV !== 'production') {
            app.delete('/api/dev/clear-users', async (_req, res) => {
                try {
                    const result = await Profile.deleteMany({});
                    res.json({
                        message: 'All profiles deleted',
                        deletedCount: result.deletedCount,
                    });
                }
                catch (err) {
                    console.error('[DEV] Failed to clear users:', err);
                    res.status(500).json({ error: 'Failed to clear users' });
                }
            });
        }
        // Note; Health check endpoint
        app.get('/health', (_req, res) => res.send('OK'));
        // Note; Mount GraphQL middleware with authentication context
        app.use('/graphql', expressMiddleware(apollo, {
            context: async ({ req, res }) => {
                const r = req;
                authenticateToken({ req: r, res });
                return { user: r.user };
            },
        }));
        // Note; Serve static React build in production mode
        if (NODE_ENV === 'production') {
            const staticPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
            app.use(express.static(staticPath));
            app.get('*', (_req, res) => {
                res.sendFile(path.join(staticPath, 'index.html'));
            });
        }
        // Note; Start listening on configured port
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
// Note; Invoke startup
startServer();
