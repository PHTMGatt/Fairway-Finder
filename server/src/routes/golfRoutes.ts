// server/src/routes/golfRoutes.ts
// Express proxy for GolfCourseAPI: search + course detail.
// The free key allows ~35 requests/day, so results are cached for a day,
// inputs are validated, and upstream error bodies are never echoed to clients.

import express, { Request, Response } from 'express';
import { fetchWithTimeout as fetch } from '../services/http.js';
import { cacheKey, createTtlCache } from '../utils/ttlCache.js';

const router = express.Router();

const API_BASE = 'https://api.golfcourseapi.com/v1';
const GOLF_API_KEY = process.env.GOLF_API_KEY?.trim();
const unavailableMessage = 'Golf course data provider is not configured';
const DAY_MS = 24 * 60 * 60 * 1000;

const searchCache = createTtlCache<unknown>({ ttlMs: DAY_MS, maxEntries: 500 });
const detailCache = createTtlCache<unknown>({ ttlMs: 7 * DAY_MS, maxEntries: 1000 });

/** GolfCourseAPI ids are short alphanumerics (e.g. "86gj0vqf"); older ones are numeric. */
export const isValidCourseId = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9]{1,32}$/.test(id);

/** 2-80 visible characters; anything else is rejected before spending quota. */
export const cleanSearchQuery = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\p{L}\p{N}\s'&.-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length >= 2 && cleaned.length <= 80 ? cleaned : null;
};

const upstream = async (path: string) =>
  fetch(`${API_BASE}${path}`, { headers: { Authorization: `Key ${GOLF_API_KEY}` } });

router.get('/golf/search', async (req: Request, res: Response) => {
  const query = cleanSearchQuery(req.query.search_query);
  if (!query) return res.status(400).json({ error: 'Enter 2 to 80 characters to search' });
  if (!GOLF_API_KEY) return res.status(503).json({ error: unavailableMessage });

  const key = cacheKey(query);
  const cached = searchCache.get(key);
  if (cached) return res.json(cached);

  try {
    const response = await upstream(`/search?search_query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      console.error(`Golf API search error (${response.status})`);
      return res.status(response.status === 429 ? 429 : 502).json({ error: 'Course lookup is unavailable right now' });
    }
    const data = await response.json();
    searchCache.set(key, data);
    return res.json(data);
  } catch (err) {
    console.error('Golf API search proxy failed:', err instanceof Error ? err.message : err);
    return res.status(502).json({ error: 'Course lookup is unavailable right now' });
  }
});

router.get('/golf/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidCourseId(id)) return res.status(400).json({ error: 'Invalid course id' });
  if (!GOLF_API_KEY) return res.status(503).json({ error: unavailableMessage });

  const cached = detailCache.get(id);
  if (cached) return res.json(cached);

  try {
    const response = await upstream(`/courses/${encodeURIComponent(id)}`);
    if (!response.ok) {
      console.error(`Golf API detail error (${response.status})`);
      const status = response.status === 404 ? 404 : response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: status === 404 ? 'Course not found' : 'Course lookup is unavailable right now' });
    }
    const data = await response.json();
    detailCache.set(id, data);
    return res.json(data);
  } catch (err) {
    console.error('Golf API detail proxy failed:', err instanceof Error ? err.message : err);
    return res.status(502).json({ error: 'Course lookup is unavailable right now' });
  }
});

export default router;
