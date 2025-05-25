// src/server.ts

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Note; Create __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note; Load root-level .env for API keys and secrets
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

import Profile from './models/Profile.js'; // For dev user wipe
import mongoose from 'mongoose';

// ✅ Dev-only schema to confirm MongoDB connection
const PingSchema = new mongoose.Schema({ name: String });
const Ping = mongoose.model('Ping', PingSchema);

async function startServer() {
  try {
    // 🟢 Connect to MongoDB
    await db();

    // ✅ One-time ping check to confirm DB exists
    const existingPing = await Ping.findOne({ name: 'VSCodeCheck' });
    if (!existingPing) {
      const ping = await Ping.create({ name: 'VSCodeCheck' });
      console.log(`✅ MongoDB test write successful (Ping ID: ${ping._id})`);
    } else {
      console.log(`✅ MongoDB already initialized (Ping ID: ${existingPing._id})`);
    }

    // 🚀 Start Apollo GraphQL
    const apollo = new ApolloServer({ typeDefs, resolvers });
    await apollo.start();

    const app = express();
    app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
    app.use(express.json());

    // 🔗 REST API Routes
    app.use('/api', courseRoutes);
    app.use('/api/weather', weatherRoutes);
    app.use('/api/map', mapRoutes);

    // 🔥 Dev-only route to clear users
    app.delete('/api/dev/clear-users', async (_req, res) => {
      try {
        const result = await Profile.deleteMany({});
        res.json({ message: 'All profiles deleted', deletedCount: result.deletedCount });
      } catch (err) {
        console.error('[DEV] Failed to clear users:', err);
        res.status(500).json({ error: 'Failed to clear users' });
      }
    });

    // 📡 GraphQL endpoint with JWT
    app.use(
      '/graphql',
      expressMiddleware(apollo as any, {
        context: async ({ req }) => authenticateToken({ req }),
      })
    );

    // 🌐 Serve React client in production
    if (process.env.NODE_ENV === 'production') {
      const staticPath = path.join(__dirname, '../client/dist');
      app.use(express.static(staticPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
      });
    }

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`🚀 GraphQL: http://localhost:${port}/graphql`);
      console.log(`🟢 Courses REST: http://localhost:${port}/api/courses?city=Orlando`);
      console.log(`🌤️ Weather REST: http://localhost:${port}/api/weather?city=Detroit`);
      console.log(`🚗 Directions REST: http://localhost:${port}/api/map/directions?origin=CityA&destination=CityB`);
      console.log(`🧼 Dev: DELETE http://localhost:${port}/api/dev/clear-users`);
    });
  } catch (err: any) {
    console.error('Startup error:', err.stack || err);
    process.exit(1);
  }
}

startServer();
