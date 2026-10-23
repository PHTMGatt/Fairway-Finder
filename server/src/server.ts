// server/src/server.ts
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../.env'
  ),
});

const {
  MONGODB_URI,
  PORT = '3001',
  PLACES_API_KEY,
  JWT_SECRET_KEY,
  GOLF_API_KEY,
  NODE_ENV = 'development',
  TRUST_PROXY,
  DEBUG_CLIENT_IP,
} = process.env;

if (!MONGODB_URI || !PLACES_API_KEY || !JWT_SECRET_KEY || !GOLF_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

if (NODE_ENV !== 'production') {
  console.log(`🔑 Environment loaded:
  • MongoDB URI: configured
  • Server Port: ${PORT}
  • Places Key: configured
  • Golf Key: configured
  • JWT Secret: configured`);
}

import { connectDatabase } from './config/connection.js';
import { initializeModelIndexes } from './models/index.js';
import { schema } from './schemas/index.js';
import courseRoutes from './routes/courseRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import golfRoutes from './routes/golfRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import { authenticateToken } from './utils/auth.js';
import { apiLimiter, rateLimitMiddleware, resolveTrustProxy } from './utils/rateLimit.js';
import { startGuestCleanup } from './utils/guestCleanup.js';

async function startServer() {
  try {
    await connectDatabase();
    await initializeModelIndexes();
    console.log('✅ MongoDB indexes ready (guest TTL + invite uniqueness)');
    startGuestCleanup();

    const apollo = new ApolloServer({
      typeDefs: schema.typeDefs,
      resolvers: schema.resolvers,
    });
    await apollo.start();

    const app = express();
    app.set('trust proxy', resolveTrustProxy(TRUST_PROXY, NODE_ENV));
    app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
    app.use(express.json());
    app.use(compression());

    // Note; Opt-in check that req.ip is the real client IP behind Render's proxy
    if (DEBUG_CLIENT_IP === 'true') {
      app.get('/api/debug/client-ip', (req, res: Response) => {
        const forwarded = String(req.headers['x-forwarded-for'] || '');
        res.json({
          ip: req.ip,
          trustProxy: app.get('trust proxy'),
          forwardedHops: forwarded ? forwarded.split(',').length : 0,
        });
      });
    }

    app.use('/api', rateLimitMiddleware(apiLimiter));
    app.use('/api', courseRoutes);
    app.use('/api', weatherRoutes);
    app.use('/api', mapRoutes);
    app.use('/api', golfRoutes);
    app.use('/api', locationRoutes);

    app.get('/health', (_req, res: Response) => res.send('OK'));

    app.use(
      '/graphql',
      expressMiddleware(apollo, {
        context: async ({ req, res }) => {
          const r = req as any;
          authenticateToken({ req: r, res });
          return { user: r.user, ip: r.ip };
        },
      })
    );

    if (NODE_ENV === 'production') {
      const staticPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../client/dist'
      );
      app.use(express.static(staticPath));
      app.get('*', (_req, res: Response) => {
        res.sendFile(path.join(staticPath, 'index.html'));
      });
    }

    const portNumber = parseInt(PORT, 10) || 3001;
    app.listen(portNumber, () => {
      console.log(`🚀 Server running on port ${portNumber}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
