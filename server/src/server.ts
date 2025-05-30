import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

// Create __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Destructure and validate critical env vars
const {
  MONGODB_URI,
  PORT = '3001',
  WEATHER_API_KEY,
  PLACES_API_KEY,
  JWT_SECRET_KEY,
  NODE_ENV = 'development',
} = process.env;

if (!MONGODB_URI || !WEATHER_API_KEY || !PLACES_API_KEY || !JWT_SECRET_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

if (NODE_ENV !== 'production') {
  console.log(`🔑 Environment loaded:
  • MongoDB URI: ${MONGODB_URI}
  • Server Port: ${PORT}
  • Weather Key: loaded
  • Places Key: loaded
  • JWT Secret: loaded`);
}

// Import DB connection
import { connectDatabase } from './config/connection.js';

// Import GraphQL schema
import { schema } from './schemas/index.js';

// Import REST route handlers
import courseRoutes from './routes/courseRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import mapRoutes from './routes/mapRoutes.js';

// JWT auth middleware
import { authenticateToken } from './utils/auth.js';

// Profile model for dev route
import Profile from './models/Profile.js';

async function startServer() {
  try {
    await connectDatabase();

    // Dev-only MongoDB test write
    if (NODE_ENV !== 'production') {
      const Ping = mongoose.model('Ping', new mongoose.Schema({ name: String }));
      const existing = await Ping.findOne({ name: 'VSCodeCheck' });
      if (!existing) {
        const ping = await Ping.create({ name: 'VSCodeCheck' });
        console.log(`✅ MongoDB test write successful (Ping ID: ${ping._id})`);
      } else {
        console.log(`✅ MongoDB already initialized (Ping ID: ${existing._id})`);
      }
    }

    const apollo = new ApolloServer({
      typeDefs: schema.typeDefs,
      resolvers: schema.resolvers,
    });
    await apollo.start();

    const app = express();
    app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
    app.use(express.json());
    app.use(compression()); // 🔥 reduce static payload size

    // REST API routes
    app.use('/api', courseRoutes);
    app.use('/api', weatherRoutes);
    app.use('/api', mapRoutes);

    // Dev-only clear route
    if (NODE_ENV !== 'production') {
      app.delete('/api/dev/clear-users', async (_req, res) => {
        try {
          const result = await Profile.deleteMany({});
          res.json({ message: 'All profiles deleted', deletedCount: result.deletedCount });
        } catch (err) {
          console.error('[DEV] Failed to clear users:', err);
          res.status(500).json({ error: 'Failed to clear users' });
        }
      });
    }

    // Health check for Render
    app.get('/health', (_req, res) => res.send('OK'));

    // Mount GraphQL with auth
    app.use(
      '/graphql',
      expressMiddleware(apollo, {
        context: async ({ req }) => authenticateToken({ req }),
      })
    );

    // Serve React client in production
    if (NODE_ENV === 'production') {
      const staticPath = path.resolve(__dirname, '../../client/dist');
      app.use(express.static(staticPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
      });
    }

    const portNumber = parseInt(PORT, 10) || 3001;
    app.listen(portNumber, () => {
      console.log(`🚀 Server running at http://localhost:${portNumber}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
