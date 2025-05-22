import express from 'express';
import cors from 'cors';
import path from 'node:path';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import db from './config/connection.js';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';
// Note; REST API routes for courses and weather
import courseRoutes from './routes/courseRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
dotenv.config();
async function startServer() {
    // Note; Connect to MongoDB
    await db();
    // Note; Initialize ApolloServer with our schema
    const apollo = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await apollo.start(); // Note; Start Apollo server
    const app = express();
    // Note; Enable CORS for React client on port 3000
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    // Note; Parse JSON bodies
    app.use(express.json());
    // Note; Mount REST endpoints under /api
    app.use('/api', courseRoutes);
    app.use('/api', weatherRoutes);
    // Note; Mount GraphQL endpoint with authentication middleware
    app.use('/graphql', expressMiddleware(apollo, {
        context: authenticateToken, // attaches req.user if token valid
    }));
    // Note; In production, serve React build and handle client-side routing
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../client/dist')));
        app.get('*', (_req, res) => {
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        });
    }
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`🚀 GraphQL: http://localhost:${port}/graphql`);
        console.log(`🟢 Courses REST: http://localhost:${port}/api/courses?city=Orlando`);
        console.log(`🌤️ Weather REST: http://localhost:${port}/api/weather?city=Detroit`);
    });
}
startServer(); // Note; Launch the server
