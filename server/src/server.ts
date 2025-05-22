// server/src/server.ts

import path from 'node:path';
import dotenv from 'dotenv';
//Note; Load root‐level .env so PLACES_API_KEY (and other vars) are picked up
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import db from './config/connection.js';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';

import courseRoutes from './routes/courseRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import mapRoutes from './routes/mapRoutes.js';

async function startServer() {
  //Note; Connect to MongoDB
  await db();

  //Note; Initialize ApolloServer
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();

  const app = express();

  //Note; Enable CORS for React client
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );

  //Note; Parse JSON bodies
  app.use(express.json());

  //Note; Mount REST endpoints
  app.use('/api', courseRoutes);
  app.use('/api', weatherRoutes);
  app.use('/api/map', mapRoutes);

  //Note; Mount GraphQL endpoint with auth
  app.use(
    '/graphql',
    expressMiddleware(apollo as any, {
      context: authenticateToken as any,
    })
  );

  //Note; Serve client build in production
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
    console.log(`🚗 Directions REST: http://localhost:${port}/api/map/directions?origin=CityA&destination=CityB`);
  });
}

startServer();  
