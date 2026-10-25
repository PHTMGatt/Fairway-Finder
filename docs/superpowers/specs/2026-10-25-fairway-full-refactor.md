# Fairway Finder Full Refactor Spec

## Intent

Refactor Fairway Finder into one coherent golf-trip planning product without rewriting the stack or blindly deleting working code. Preserve the verified Guest Demo/auth hardening on `auth-invite-guest`, keep MongoDB data intact, and improve correctness before visual polish.

## Product center

A saved Trip is the center of the application. Course discovery, routing, weather, players, scorecards, handicap/course-rating context, and saved-trip review should all connect to that Trip rather than behave like unrelated utility pages.

Target journey:

1. Understand Fairway Finder.
2. Enter through Guest Demo, invite signup, or login.
3. Find a course/location.
4. Select a real course with stable provider identity and location metadata.
5. Create a Trip.
6. Return to one Trip Details hub for course, route/map, weather, players, scores, and handicap context.
7. Reopen the Trip later or on another device without losing core trip facts.

## Goals

- Preserve the React/TypeScript/Vite + Express/Apollo/Mongoose architecture.
- Preserve working Guest Demo, invite-only signup, auth hardening, provider fallbacks, and CI.
- Eliminate correctness bugs before design work.
- Make Trip/Course data canonical in MongoDB rather than shadowing core facts in `localStorage`.
- Make external APIs pass through clear backend service boundaries with normalized errors/timeouts.
- Make the UI calmer, more consistent, mobile-friendly, and task-oriented.
- Improve tests around workflows that matter rather than pursuing meaningless coverage.
- Keep every change reviewable and reversible on a feature branch.

## Non-goals

- No framework rewrite.
- No microservices split.
- No database destruction or bulk migration during refactor implementation.
- No merge to `main` or Render deployment without explicit user approval.
- No replacement of Google Maps, GolfCourseAPI, Open-Meteo, or OSM simply because alternatives exist.
- No public release of Guest Demo until its production prerequisites are verified.

## Safety constraints

- Work only on `gandalf/fairway-full-refactor-2026-10-25`, based on `auth-invite-guest` commit `10453126afc895b1ef5dc810c71138b4451a1ff4`.
- Do not mutate Atlas data or indexes as part of code refactor work.
- Do not deploy or merge.
- Do not expose secret values. Environment variables may be named only.
- Keep compatibility with existing permanent Trip documents while schemas evolve.
- Any eventual cleanup of the seven confirmed dangling Profile -> Trip references requires a separate explicit approval and backup/repair plan.

## Verified current architecture

### Client

React 18 + TypeScript + Vite. Apollo Client handles account/trip GraphQL data. REST fetches handle courses, maps/routes, weather, location suggestions, and golf-course details. Google Maps JS is manipulated through `window.google.maps` after loading.

### Server

Node + Express + TypeScript + Apollo Server. REST routes under `/api/*`; GraphQL under `/graphql`; Mongoose for Atlas; static client served by Express in production.

### MongoDB

Current Atlas database `Fairway-Finder` has `profiles`, `trips`, and `pings`. There are seven profiles and one trip. Seven of eight stored Profile trip references are dangling. Current production-like data has no Guest Demo documents or invite collection because the feature branch is not deployed.

### Hosting

Render service points at `main`, auto-deploy is off, and the current live commit is older than `auth-invite-guest`.

## Architecture decisions

### 1. Canonical TripCourse

When the user selects a course, preserve the useful identity/metadata instead of reducing it to a name. A Trip course record should support:

- `name: string`
- `address?: string`
- `location?: { lat: number; lng: number }`
- `source?: 'google' | 'golfcourseapi' | 'osm' | 'manual'`
- `providerId?: string`
- `rating?: number | null`
- `slope?: number | null`

Legacy Trip documents containing only `name` remain valid.

### 2. Trip owns durable trip facts

Durable facts such as trip date, selected course, course identity/location, rating/slope enrichment, players, scores, and handicaps belong in MongoDB. `localStorage` may retain session/auth state and harmless UI preferences, but must not be required to reconstruct a Trip on another browser/device.

### 3. Explicit mutation identity

Mutations that change a Trip must identify the Trip explicitly. In particular, `removeCourseFromTrip` must take `tripId` and must not search every owned trip by course name.

### 4. Backend provider services

Provider-specific logic should move out of Express route modules into focused server services. Routes validate request/response contracts and orchestrate service calls. Services own provider calls, timeouts, fallbacks, and normalization.

Initial service boundaries:

- `server/src/services/http.ts`: timeout-aware fetch helper.
- `server/src/services/geocoding.ts`: Google/Open-Meteo/Nominatim coordinate lookup and normalization.
- `server/src/services/courseDiscovery.ts`: Google Places -> OSM -> GolfCourseAPI discovery.
- `server/src/services/weather.ts`: Open-Meteo current/forecast normalization.
- `server/src/services/routing.ts`: Google Routes -> legacy Directions -> OSRM.
- `server/src/services/places.ts`: route POI discovery via Google -> OSM.

Do not over-generalize providers into a plugin framework.

### 5. Trip Details as the hub

Trip Details becomes the main place to understand a saved trip. Its information hierarchy is:

1. Trip identity/date/status.
2. Selected course and location.
3. Weather relevant to the trip/course.
4. Route/map actions.
5. Players/scorecard/handicap context.
6. Destructive actions kept secondary and confirmed.

Standalone Course Finder/Route/Weather pages can remain, but should feed or complement trips rather than feel like separate products.

### 6. UI system

Introduce lightweight shared tokens/primitives rather than a component-library rewrite:

- typography scale
- spacing/radius/shadow/color tokens
- button variants
- form-control styles
- cards/panels
- status/loading/error/empty states
- responsive shell/navigation rules

Avoid excessive gradients/glass/animation.

## External integration rules

### Google Maps Platform

Keep `PLACES_API_KEY` server-side for Geocoding/Places/Routes and `VITE_GOOGLE_MAPS_API_KEY` for browser map rendering. Preserve New API usage and legacy API fallback only where it materially improves resilience.

### GolfCourseAPI

Keep `GOLF_API_KEY` server-side. Use provider IDs when known instead of fuzzy name re-search. Do not make Handicap depend on local hard-coded data once canonical TripCourse integration is ready.

### Open-Meteo

Preserve as weather provider and location-autocomplete source. Prefer coordinate-based weather lookups once TripCourse location exists.

### OpenStreetMap/Nominatim/Overpass/OSRM

Treat public endpoints as best-effort fallbacks, use a clear User-Agent, add request timeouts, avoid bursty calls, and expose attribution where OSM data is displayed.

## Guest Demo

Preserve the 24-hour guest profile/trip model, caps, TTL design, rate limiting, and backup cleanup. Correct the user-facing copy to say temporary demo data is automatically deleted after 24 hours; do not claim the data itself stays only on the device.

## Data integrity

Do not repair Atlas automatically. Add read-only/reporting utilities and prevent future corruption first. A later approved repair can remove dangling Profile trip references after backup and exact preview.

For future ownership hardening, an explicit `ownerId` on Trip is desirable, but it is not required in the first compatibility refactor. Do not introduce a risky production migration just to normalize the schema.

## Security

Preserve current JWT/auth hardening. Consider HttpOnly cookie sessions only as a later isolated security project; do not combine that migration with the application refactor.

Add/retain protections for:

- ownership checks
- input validation
- rate limits
- safe seed/invite tooling
- server-only provider secrets
- production debug endpoints off by default
- confirmation/error feedback for destructive UI actions

## Testing strategy

Prioritize behavioral tests for:

- trip ownership and mutation targeting
- canonical course persistence
- legacy Trip compatibility
- Guest Demo limits/expiry/copy
- provider normalization and fallback behavior
- timeout/error behavior
- Trip Details without localStorage dependency
- destructive trip actions
- mobile/navigation helpers where practical

CI must remain green for lint, build, server tests, and client tests.

## Definition of done for the refactor branch

- Existing verified auth/Guest Demo behavior is preserved.
- `removeCourseFromTrip` cannot affect an unintended trip.
- New trips retain selected course identity/address/location/provider metadata.
- Trip Details renders durable date/course facts from GraphQL, not browser shadow state.
- Weather can use saved course coordinates or a stable saved location.
- External REST routes use shared timeout-aware service boundaries for core providers.
- Handicap no longer relies on a permanently hard-coded `USE_API = false` path for normal operation.
- Destructive Saved Trips UX is confirmed and surfaces errors.
- Guest Demo copy is accurate.
- Shared visual tokens/primitives reduce per-page inconsistency.
- Narrow mobile layouts are verified.
- Dead dependencies/code are removed only after import/reference verification.
- Full CI passes on the refactor branch.
- No Atlas mutation, `main` merge, or Render deployment occurs without explicit approval.
