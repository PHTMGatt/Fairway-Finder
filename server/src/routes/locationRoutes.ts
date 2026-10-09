import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

interface Suggestion {
  label: string;
  value: string;
}

router.get(
  '/locations/suggest',
  async (
    req: Request<object, Suggestion[] | { error: string }, object, { q?: string }>,
    res: Response
  ) => {
    const rawQuery = req.query.q?.trim() || '';
    if (rawQuery.length < 2) return res.json([]);

    const [namePart, regionPart] = rawQuery.split(',').map((part) => part.trim());
    const searchName = namePart || rawQuery;

    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.searchParams.set('name', searchName);
      url.searchParams.set('count', '8');
      url.searchParams.set('language', 'en');
      url.searchParams.set('format', 'json');
      url.searchParams.set('countryCode', 'US');

      const response = await fetch(url.toString());
      if (!response.ok) return res.json([]);

      const payload: any = await response.json();
      let results = Array.isArray(payload.results) ? payload.results : [];

      if (regionPart) {
        const region = regionPart.toLowerCase();
        results = results.sort((a: any, b: any) => {
          const aRegion = String(a.admin1 || '').toLowerCase();
          const bRegion = String(b.admin1 || '').toLowerCase();
          const aMatch = aRegion.startsWith(region) ? 1 : 0;
          const bMatch = bRegion.startsWith(region) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      const seen = new Set<string>();
      const suggestions: Suggestion[] = [];

      for (const result of results) {
        const name = String(result.name || '').trim();
        if (!name) continue;

        const region = String(result.admin1 || '').trim();
        const county = String(result.admin2 || '').trim();
        const value = [name, region].filter(Boolean).join(', ');
        const detail = county && county !== region ? `${value} · ${county}` : value;
        const key = value.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        suggestions.push({ label: detail, value });
        if (suggestions.length >= 6) break;
      }

      return res.json(suggestions);
    } catch (error) {
      console.error(
        'Location autocomplete failed:',
        error instanceof Error ? error.message : error
      );
      return res.json([]);
    }
  }
);

export default router;
