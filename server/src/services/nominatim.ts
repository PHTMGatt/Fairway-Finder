import type { RequestInit } from 'node-fetch';
import { fetchWithTimeout } from './http.js';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface FetchResponse {
  ok: boolean;
  json(): Promise<unknown>;
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<FetchResponse>;
type SleepImpl = (milliseconds: number) => Promise<void>;
type NowImpl = () => number;

interface NominatimGeocoderOptions {
  fetchImpl?: FetchImpl;
  sleepImpl?: SleepImpl;
  now?: NowImpl;
  requestSpacingMs?: number;
  cacheTtlMs?: number;
}

interface CacheEntry {
  value: Coordinates | null;
  expiresAt: number;
}

const DEFAULT_REQUEST_SPACING_MS = 1_000;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const USER_AGENT = 'Fairway-Finder/1.0';

const normalizeQuery = (query: string) => query.trim().replace(/\s+/g, ' ');
const cacheKey = (query: string) => normalizeQuery(query).toLowerCase();

const defaultSleep: SleepImpl = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const createNominatimGeocoder = ({
  fetchImpl = fetchWithTimeout,
  sleepImpl = defaultSleep,
  now = Date.now,
  requestSpacingMs = DEFAULT_REQUEST_SPACING_MS,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
}: NominatimGeocoderOptions = {}) => {
  const cache = new Map<string, CacheEntry>();
  const inflight = new Map<string, Promise<Coordinates | null>>();
  let requestQueue: Promise<void> = Promise.resolve();
  let nextRequestAt = 0;

  const request = async (query: string): Promise<Coordinates | null> => {
    const waitMs = Math.max(0, nextRequestAt - now());
    if (waitMs > 0) await sleepImpl(waitMs);
    nextRequestAt = now() + Math.max(0, requestSpacingMs);

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'us');

    const response = await fetchImpl(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const first = Array.isArray(payload) ? payload[0] : null;
    const lat = Number(first && typeof first === 'object' ? (first as { lat?: unknown }).lat : NaN);
    const lng = Number(first && typeof first === 'object' ? (first as { lon?: unknown }).lon : NaN);

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  };

  return async (rawQuery: string): Promise<Coordinates | null> => {
    const query = normalizeQuery(rawQuery);
    if (!query) return null;

    const key = cacheKey(query);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.value;
    if (cached) cache.delete(key);

    const existing = inflight.get(key);
    if (existing) return existing;

    const current = requestQueue.then(() => request(query));
    requestQueue = current.then(
      () => undefined,
      () => undefined
    );
    inflight.set(key, current);

    try {
      const value = await current;
      cache.set(key, {
        value,
        expiresAt: now() + Math.max(0, cacheTtlMs),
      });
      return value;
    } finally {
      if (inflight.get(key) === current) inflight.delete(key);
    }
  };
};

export const geocodeNominatim = createNominatimGeocoder();
