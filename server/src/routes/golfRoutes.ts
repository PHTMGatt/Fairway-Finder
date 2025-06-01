// server/src/routes/golfRoutes.ts
// Note; Express route proxy for GolfCourseAPI — handles search + detail fetch

import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const API_BASE = 'https://api.golfcourseapi.com/v1';
const GOLF_API_KEY = process.env.GOLF_API_KEY;

if (!GOLF_API_KEY) {
  console.error('❌ GOLF_API_KEY is missing from .env!');
  process.exit(1);
}

// Note; Proxy to search golf courses by name or club name
router.get('/golf/search', async (req: Request, res: Response) => {
  const { search_query } = req.query;

  if (!search_query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const response = await fetch(`${API_BASE}/search?search_query=${encodeURIComponent(search_query as string)}`, {
      headers: {
        Authorization: `Key ${GOLF_API_KEY}`,
      },
    });

    if (!response.ok) {
      const msg = await response.text();
      console.error(`❌ Golf API search error (${response.status}):`, msg);
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('❌ Proxy search failed:', err);
    return res.status(500).json({ error: 'Golf API search proxy failed' });
  }
});

// Note; Proxy to get course details by ID
router.get('/golf/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing course ID' });
  }

  try {
    const response = await fetch(`${API_BASE}/courses/${id}`, {
      headers: {
        Authorization: `Key ${GOLF_API_KEY}`,
      },
    });

    if (!response.ok) {
      const msg = await response.text();
      console.error(`❌ Golf API detail error (${response.status}):`, msg);
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('❌ Proxy course detail failed:', err);
    return res.status(500).json({ error: 'Golf API course detail proxy failed' });
  }
});

export default router;
