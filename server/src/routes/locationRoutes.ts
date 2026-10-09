import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

interface Suggestion {
  label: string;
  value: string;
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'District of Columbia': 'DC',
};

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
          const aName = String(a.admin1 || '').trim();
          const bName = String(b.admin1 || '').trim();
          const aRegion = aName.toLowerCase();
          const bRegion = bName.toLowerCase();
          const aAbbr = (STATE_ABBREVIATIONS[aName] || '').toLowerCase();
          const bAbbr = (STATE_ABBREVIATIONS[bName] || '').toLowerCase();
          const aMatch = aRegion.startsWith(region) || aAbbr.startsWith(region) ? 1 : 0;
          const bMatch = bRegion.startsWith(region) || bAbbr.startsWith(region) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      const seen = new Set<string>();
      const suggestions: Suggestion[] = [];

      for (const result of results) {
        const name = String(result.name || '').trim();
        if (!name) continue;

        const regionName = String(result.admin1 || '').trim();
        const region = STATE_ABBREVIATIONS[regionName] || regionName;
        const county = String(result.admin2 || '').trim();
        const value = [name, region].filter(Boolean).join(', ');
        const detail = county && county !== regionName
          ? `${value} · ${county}`
          : value;
        const key = value.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        suggestions.push({ label: detail, value });
        if (suggestions.length >= 4) break;
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
