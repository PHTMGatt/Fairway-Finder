# Fairway Finder API / Provider Hardening Design

**Date:** 2026-10-25

## Intent

Make Fairway Finder's existing external integrations more reliable and easier to maintain without replacing providers that are already working. Preserve the public `/api/*` contracts while moving repeated provider concerns into small shared modules.

## Goals

- Keep MongoDB and JWT configuration as true core server requirements.
- Treat Google Places/Routes and GolfCourseAPI keys as provider capabilities rather than reasons the entire server must fail to start when keyless fallbacks can still serve part of the product.
- Bound every outbound provider request with a timeout.
- Consolidate duplicated Google/Nominatim geocoding logic.
- Keep Google Places API (New), Routes v2, Open-Meteo, and GolfCourseAPI as the preferred current providers.
- Keep legacy Google, Nominatim, Overpass, and OSRM as controlled fallbacks rather than expanding reliance on them.
- Preserve all existing client REST endpoint shapes unless a compatibility bug requires a narrow normalization.

## Non-goals

- No paid service or API purchase.
- No generic provider/plugin framework.
- No replacement of Google Maps, Open-Meteo, GolfCourseAPI, MongoDB, GraphQL, or Render.
- No production environment-variable changes or deployment in this phase.
- No destructive production database work.

## Approaches considered

### 1. Patch each route locally

Smallest initial diff, but it leaves duplicated geocoding, inconsistent timeouts, and provider-specific failure behavior spread across large route files. Rejected because it would preserve the maintenance problem.

### 2. Small shared provider utilities/services — chosen

Extract only cross-cutting concerns that are already duplicated: runtime capability checks, bounded HTTP requests, and geocoding. Existing routes continue to orchestrate their current fallbacks, so behavior changes remain narrow and reversible.

### 3. Generic provider abstraction/framework

Could make every provider interchangeable behind a formal interface, but that is a much larger architecture replacement than this app needs. Rejected.

## Runtime configuration

Core requirements remain:

- `MONGODB_URI`
- `JWT_SECRET_KEY`

Provider capabilities are optional at server startup:

- `PLACES_API_KEY`
- `GOLF_API_KEY`

If Google is absent, course/map routes skip Google calls and use the existing OpenStreetMap/OSRM fallbacks where supported. If GolfCourseAPI is absent, golf-specific proxy endpoints return a clear `503` instead of terminating the process; course discovery can continue through Google/OSM when available.

Production Render environment values are not changed by this refactor.

## Outbound HTTP

Add one shared timeout wrapper around `node-fetch` using `AbortController`. Default provider timeout should be conservative (about 8 seconds) and overridable per call when needed. Timeout errors stay internal; API routes continue returning their existing normalized application errors/fallback behavior.

No automatic broad retries are added in this phase because retries against public fallbacks can amplify rate-limit problems. A provider-specific retry can be added later only where safe/idempotent and supported by policy.

## Geocoding

Create one server geocoding service used by course and map routes:

1. Google Geocoding when `PLACES_API_KEY` is configured.
2. Nominatim fallback.

Nominatim use must be identifiable and controlled. The service will keep the existing Fairway Finder User-Agent, add a small in-memory cache, and serialize public Nominatim requests so the process does not intentionally exceed the public service's roughly one-request-per-second limit. This is sufficient for the current single-instance/private-use deployment; if the app ever scales horizontally, a shared cache/rate limiter or different geocoder would be needed.

## GolfCourseAPI compatibility

Keep the current server proxy response shape (provider response passed through) and fix the dormant Handicap client expectation instead of wrapping the API in a conflicting `{ course: ... }` shape. This avoids breaking Trip Details, which already consumes the direct provider response.

Handicap remains secondary functionality; enabling its live API mode is not required in the same commit as the contract fix.

## Error behavior

- Missing optional provider key: skip provider or return provider-specific `503` where no fallback is meaningful.
- Provider timeout/network error: log concise provider context and continue to the next supported fallback when available.
- Client-facing errors remain provider-agnostic where practical.
- Secrets are never logged.

## Verification

Each slice uses regression tests plus the existing full GitHub Actions gate. Provider tests must not call real paid/public APIs; use pure helpers, local test servers, or injected/stubbed fetch behavior.
