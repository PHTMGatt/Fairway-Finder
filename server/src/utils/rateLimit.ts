// server/src/utils/rateLimit.ts

import { GraphQLError } from 'graphql';
import type { Request, Response, NextFunction } from 'express';

/**
 * In-memory fixed-window rate limiter keyed by client IP.
 * Counts live in this process only, so they reset on restart and are not
 * shared between instances (fine for a single Render instance).
 */
export interface RateLimiter {
  consume(key: string): { allowed: boolean; retryAfterSeconds: number };
}

export const createRateLimiter = ({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}): RateLimiter => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Note; Drop expired windows so the map can't grow without bound
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return {
    consume(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return {
        allowed: entry.count <= max,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    },
  };
};

/**
 * Express 'trust proxy' value, which decides what req.ip is. Render's docs use 1 hop;
 * override with TRUST_PROXY (a hop count, "true" or "false") if
 * /api/debug/client-ip shows the wrong address. Off outside production so
 * X-Forwarded-For can't be spoofed to dodge the limits.
 */
export const resolveTrustProxy = (
  value: string | undefined,
  nodeEnv: string
): boolean | number | string => {
  if (value === undefined || value === '') {
    return nodeEnv === 'production' ? 1 : false;
  }
  if (value === 'false') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
};

const clientKey = (ip: string | undefined) => ip || 'unknown';

/**
 * Express middleware: responds 429 with Retry-After once the IP exceeds the limit.
 */
export const rateLimitMiddleware =
  (limiter: RateLimiter) => (req: Request, res: Response, next: NextFunction) => {
    const { allowed, retryAfterSeconds } = limiter.consume(clientKey(req.ip));
    if (allowed) return next();
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  };

/**
 * GraphQL resolver guard: throws a RATE_LIMITED error once the IP exceeds the limit.
 */
export const enforceRateLimit = (limiter: RateLimiter, ip: string | undefined) => {
  const { allowed, retryAfterSeconds } = limiter.consume(clientKey(ip));
  if (!allowed) {
    throw new GraphQLError('Too many attempts, please try again later.', {
      extensions: { code: 'RATE_LIMITED', retryAfterSeconds },
    });
  }
};

// Note; Shared limiters for the auth mutations (per IP)
export const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
export const signupLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });
export const guestLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 });

// Note; Light limit on the /api proxies to paid Google/Golf/weather APIs
export const apiLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
