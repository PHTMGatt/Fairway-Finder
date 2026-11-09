// server/src/utils/ttlCache.ts
// Tiny in-memory TTL cache for third-party lookups (GolfCourseAPI free tier is
// 35 requests/day; Google Places is billed). Repeat searches cost nothing.

export interface TtlCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  readonly size: number;
}

export const createTtlCache = <V>({ ttlMs, maxEntries }: { ttlMs: number; maxEntries: number }): TtlCache<V> => {
  const store = new Map<string, { value: V; expiresAt: number }>();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      // Refresh recency (Map keeps insertion order, so re-insert = most recent).
      store.delete(key);
      store.set(key, hit);
      return hit.value;
    },
    set(key, value) {
      store.delete(key);
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      while (store.size > maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },
    get size() {
      return store.size;
    },
  };
};

/** Normalise a free-text lookup key: lower case, collapsed whitespace. */
export const cacheKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
