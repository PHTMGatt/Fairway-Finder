// server/src/server.ts
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';
async function startApolloServer() {
    // 1) connect to your database
    await db();
    // 2) create & start Apollo
    const apollo = new ApolloServer({ typeDefs, resolvers });
    await apollo.start();
    // 3) create Express app
    const app = express();
    // 4) apply CORS for your React origin
    app.use(cors({
        origin: 'http://localhost:3000', // React dev server
        credentials: true, // so cookies / JWT get sent
    }));
    // 5) body-parser must come before GraphQL middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    // 6) mount your GraphQL endpoint
    app.use('/graphql', expressMiddleware(apollo, {
        context: authenticateToken,
    }));
    // 7) in production, serve React build
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../client/dist')));
        app.get('*', (_req, res) => {
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        });
    }
    // 8) launch!
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 GraphQL server ready at http://localhost:${PORT}/graphql`);
    });
}
startApolloServer();
