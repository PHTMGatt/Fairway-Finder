# Fairway Finder — P0 + Canonical TripCourse Checkpoint

**Date:** 2026-10-25  
**Branch:** `gandalf/fairway-integration-2026-10-25`  
**Base:** `auth-invite-guest` at `10453126afc895b1ef5dc810c71138b4451a1ff4`

## Safety state

- `main` was not modified.
- Render was not deployed or reconfigured.
- Production MongoDB was inspected read-only only.
- Existing invite-only auth and Guest Demo security architecture was preserved.
- The integration branch is strictly ahead of `auth-invite-guest` and is not behind it.

## Branch reconciliation

The integration branch starts from `auth-invite-guest` so it preserves the real screenshots and Playwright MCP log ignore. It manually carries only the verified root tooling delta from `gandalf/ff-guest-ux-2026-10-23`:

- root `invite` command calls the guarded invite CLI directly
- stale root `seed` command is retired with an explicit failure message

The guarded `createInvite.ts` implementation was already identical on both source heads.

## P0 correctness completed

### Exact course removal

`removeCourseFromTrip` now requires both the owning `tripId` and embedded `courseId`. Ownership is checked before mutation, and duplicate course names on separate trips can no longer cause the wrong trip to be modified.

### Deliberate trip deletion

- Removed bulk `Delete All Trips` UI.
- Individual deletion requires explicit confirmation.
- Delete failures are visible in an accessible alert instead of being silently swallowed.

### Guest Demo copy

The shared note now reads:

> Temporary demo data is automatically deleted after 24 hours.

### JWT timing test stability

Session signing now derives explicit `iat` and `exp` from the same timestamp, removing a one-second boundary flake without changing the seven-day permanent-session policy or Guest expiry clipping.

## Production Atlas integrity checkpoint

Fresh read-only aggregate at phase close:

- profile→trip references: 8
- resolved references: 1
- dangling references: 7

The seven dangling references are unchanged and were not repaired. See `docs/audits/2026-10-25-atlas-integrity-report.md` for the full read-only checkpoint.

## Canonical TripCourse completed

New Trip course snapshots can persist:

- `name`
- `source`
- `providerId`
- `address`
- `location { lat, lng }`
- provider/display `rating`
- `golfCourseApiId`
- handicap `courseRating`
- `slope`

All enrichment/provider fields remain optional so legacy name-only Trip documents remain compatible. GraphQL still temporarily accepts legacy `courseName` callers during migration.

## Plan Trip data flow

Course search results are normalized by provider and saved as structured TripCourse data:

- normal Place IDs → Google
- `golfcourseapi-*` → GolfCourseAPI with the native numeric ID retained
- `osm-*` → OSM fallback identity

Plan Trip no longer collapses the selected course to a string name.

## Trip Details data flow

The browser-local shadow database was removed for canonical trip facts:

- Trip date comes directly from GraphQL/MongoDB.
- Weather city is no longer persisted in localStorage.
- Course/slope rating is no longer persisted in localStorage.
- Canonical provider-backed courses are not silently fuzzy-rematched by name.
- GolfCourseAPI IDs are used directly when available.
- Name lookup remains only as a compatibility fallback for legacy records without provider identity.
- Google Maps links use the persisted Google Place ID when available.

## Weather integration

`/api/weather` now supports both:

- existing city lookup: `?city=Detroit, MI`
- canonical course coordinates: `?lat=...&lng=...&name=...`

Trip Details automatically loads current weather using the saved course coordinates when available. Manual city lookup remains for legacy/no-location trips.

Plan Trip now navigates to `/trip/:id` without hidden route state. A saved Trip document and its embedded selected course are the authoritative source of date/course/location facts across reloads and devices.

## Verification

Every functional slice was developed with a RED/GREEN regression test cycle and the existing GitHub Actions gate. The completed data-flow head passed:

- dependency installation
- lint
- client + server production builds
- server test suite
- client test suite

New regression coverage includes:

- duplicate-name course removal isolation
- unauthorized course removal
- destructive trip-delete confirmation/error behavior
- Guest Demo cleanup copy
- canonical TripCourse persistence + legacy compatibility
- provider-ID normalization
- safe course enrichment selection
- weather request coordinate parsing
- saved-course weather bootstrap

## Runtime/deployment safety re-check

Render Fairway Finder remains:

- branch: `main`
- auto deploy: `no`
- auto deploy trigger: `off`

No deployment was caused by this feature branch.

## Next phase

Proceed with API/provider hardening before broad visual redesign:

1. separate core-required environment variables from optional provider keys
2. make Google/Golf provider absence degrade gracefully to existing fallbacks where possible
3. add shared outbound-request timeouts and normalized provider failure handling
4. centralize repeated geocoding/provider logic into small services
5. enforce/codify Nominatim public-service limits and caching/attribution expectations
6. then simplify product navigation around Trip as the hub and continue the responsive/design-system pass
