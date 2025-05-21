// server/src/server.ts
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import db from './config/connection.js';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';
async function startServer() {
    await db();
    const apollo = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await apollo.start();
    const app = express();
    // 1️⃣ Enable CORS for EVERY route (including OPTIONS preflights)
    app.use(cors({
        origin: 'http://localhost:3000', // your React dev server
        credentials: true, // so browsers send cookies/JWT
    }));
    // 2️⃣ JSON body parser (must come before GraphQL middleware)
    app.use(express.json());
    // 3️⃣ Mount GraphQL
    app.use('/graphql', expressMiddleware(apollo, {
        context: authenticateToken,
    }));
    // 4️⃣ In production, serve the React build
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../client/dist')));
        app.get('*', (_req, res) => {
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        });
    }
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`🚀 GraphQL server ready at http://localhost:${port}/graphql`);
    });
}
startServer();
