# Fairway Finder Full Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Fairway Finder into one coherent, safer golf-trip application centered on durable Trip data while preserving the verified auth/Guest Demo work and current stack.

**Architecture:** Keep the React/Vite client, Express/Apollo server, Mongoose/Atlas database, and Render single-service deployment model. First fix correctness and durable TripCourse data, then move provider calls behind focused services, then simplify the user flow/visual system and remove verified stale code.

**Tech Stack:** React 18, TypeScript, Vite, Apollo Client/Server, Express, Mongoose/MongoDB Atlas, Vitest, Node test runner, Google Maps Platform, GolfCourseAPI, Open-Meteo, OSM/Nominatim/Overpass/OSRM.

**Spec:** `docs/superpowers/specs/2026-10-25-fairway-full-refactor.md`

## Global Constraints

- Work only on `gandalf/fairway-full-refactor-2026-10-25` based on `auth-invite-guest` commit `10453126afc895b1ef5dc810c71138b4451a1ff4`.
- Do not modify `main` or `auth-invite-guest`.
- Do not deploy to Render.
- Do not mutate Atlas documents/indexes/collections during implementation.
- Do not expose secret values.
- Preserve legacy Trip documents that contain only course names.
- Every production behavior change follows RED -> GREEN tests.
- CI must remain lint/build/server-test/client-test clean at each completed task boundary.

## Review Focus

- A user with two trips containing the same course name must only modify the explicitly targeted trip.
- A legacy trip with only `courses[].name` must continue to load after richer course metadata is introduced.
- External-provider timeout/failure must produce a controlled application error/fallback rather than a hung request.
- A saved trip opened on a new browser with empty `localStorage` must still show its date/course/location correctly.
- Guest Demo data-retention copy must accurately describe server-side temporary storage and 24-hour deletion.

---

### Task 1: Make Trip mutations target an explicit Trip

**Files:**
- Modify: `server/src/schemas/typeDefs.ts`
- Modify: `server/src/schemas/resolvers.ts`
- Test: `server/test/trips.test.mjs`
- Modify: `client/src/utils/mutations.ts`
- Modify consumers of `REMOVE_COURSE_FROM_TRIP` if present.

**Interfaces:**
- Produces: `removeCourseFromTrip(tripId: ID!, courseName: String!): Trip`
- Preserves: ownership checks and `Trip not found` privacy behavior.

- [ ] Write a server test creating two owned trips with the same course name and assert removal from `tripId=A` leaves trip B unchanged.
- [ ] Run `npm test --prefix server -- --test-name-pattern="removeCourseFromTrip"` and verify RED because the current mutation does not require/target `tripId`.
- [ ] Change GraphQL type definitions and resolver to require `tripId`, call `requireOwnedTrip`, and update only that Trip.
- [ ] Update the client mutation signature/variables.
- [ ] Run targeted test and full `npm test --prefix server`; both must pass.
- [ ] Run root lint/build/client tests.
- [ ] Commit: `fix: target course removal by trip id`.

### Task 2: Persist canonical TripCourse data

**Files:**
- Modify: `server/src/models/Trip.ts`
- Modify: `server/src/schemas/typeDefs.ts`
- Modify: `server/src/schemas/resolvers.ts`
- Test: `server/test/trips.test.mjs`
- Modify: `client/src/pages/Trips/PlanTrip.tsx`
- Modify: `client/src/utils/mutations.ts`
- Modify: `client/src/utils/queries.ts`
- Add client test for course-input mapping if needed.

**Interfaces:**
- Produces GraphQL `CourseInput` with `name`, `address`, `location`, `source`, `providerId`, `rating`, `slope` where available.
- Produces `TripInput.course: CourseInput!` for new clients.
- Consumes existing REST course result `{ name, address, rating, place_id, location }`.
- Legacy stored trips with name-only embedded courses remain valid.

- [ ] Add failing server tests asserting `addTrip` persists address/location/source/providerId/rating while still accepting legacy documents when queried.
- [ ] Verify RED.
- [ ] Extend Trip course schema with optional `source` and `providerId` while retaining existing optional fields.
- [ ] Add `LocationInput` and `CourseInput` GraphQL inputs; change `TripInput` to accept `course`.
- [ ] Update resolver to persist the supplied normalized course object with validation.
- [ ] Update Plan Trip to map `google`/`osm-*`/`golfcourseapi-*` results to explicit source/provider identity and submit the entire selected course.
- [ ] Update GraphQL fragments/queries so address/location/source/providerId/rating/slope are available to Trip Details.
- [ ] Run targeted tests then full CI commands.
- [ ] Commit: `refactor: persist canonical trip course data`.

### Task 3: Remove core Trip dependence on localStorage

**Files:**
- Modify: `client/src/pages/Trips/TripDetails.tsx`
- Add: `client/src/pages/Trips/TripDetails.utils.ts`
- Test: `client/src/pages/Trips/TripDetails.test.ts` or `TripDetails.utils.test.ts`
- Modify GraphQL queries as required.

**Interfaces:**
- Consumes Trip GraphQL `date` and rich `courses[0]`.
- Produces helpers for deriving a weather/search label from durable course address/location without reading `tripDate-*`, `weatherCity-*`, `slopeRating-*`, or `courseRating-*` localStorage keys.

- [ ] Write failing tests proving Trip Details helpers return durable trip date/course context with empty localStorage and handle name-only legacy courses.
- [ ] Verify RED.
- [ ] Refactor Trip Details to use `trip.date` and `trip.courses[0]` as truth.
- [ ] Stop writing/reading the four trip-shadow localStorage key families.
- [ ] Correct weather form wording (`Weather location`, `Load Weather`).
- [ ] Keep graceful manual weather-location entry only when stored course metadata cannot identify a location.
- [ ] Run client targeted test and full client/root validation.
- [ ] Commit: `refactor: make trip details database driven`.

### Task 4: Add timeout-aware backend provider services

**Files:**
- Create: `server/src/services/http.ts`
- Create: `server/src/services/geocoding.ts`
- Create: `server/src/services/courseDiscovery.ts`
- Create: `server/src/services/weather.ts`
- Create: `server/src/services/routing.ts`
- Create: `server/src/services/places.ts`
- Modify: `server/src/routes/courseRoutes.ts`
- Modify: `server/src/routes/locationRoutes.ts`
- Modify: `server/src/routes/weatherRoutes.ts`
- Modify: `server/src/routes/mapRoutes.ts`
- Modify: `server/src/routes/golfRoutes.ts` only where normalization/timeout reuse applies.
- Add focused tests under `server/test/` for timeout/fallback/normalization helpers.

**Interfaces:**
- `fetchWithTimeout(url, options?, timeoutMs?)` aborts provider requests after a bounded timeout.
- Course discovery returns the existing client contract plus `source`/provider identity.
- Weather service supports coordinate-first lookup and city fallback.
- Route/POI services preserve existing REST response contracts.

- [ ] Add failing unit tests for timeout abort and provider normalization/fallback ordering using injected fetch functions where needed.
- [ ] Verify RED.
- [ ] Implement `fetchWithTimeout` with `AbortController` and a default bounded timeout.
- [ ] Extract geocoding/course/weather/routing/place provider logic from route files into focused services without changing public REST URLs.
- [ ] Normalize provider errors into controlled `502`/empty-fallback behavior.
- [ ] Add coordinate weather input (`lat`/`lng`) while retaining `city` compatibility.
- [ ] Keep Nominatim/Overpass/OSRM as best-effort fallbacks with a Fairway Finder User-Agent.
- [ ] Run server tests, lint, build, then client tests.
- [ ] Commit: `refactor: centralize external provider services`.

### Task 5: Make Trip Details the coherent trip hub

**Files:**
- Modify: `client/src/pages/Trips/TripDetails.tsx`
- Modify: `client/src/pages/Trips/TripDetails.css`
- Modify: `client/src/components/ScoreCard/ScoreCard.tsx` only if integration requires it.
- Modify: `client/src/pages/Routes/MapRouting.tsx` and/or map component only for reusable trip context.
- Add small helper/components under `client/src/components/Trip/` if needed.
- Add client behavior tests for pure helpers/components.

**Interfaces:**
- Trip Details displays persisted date/course/location.
- Weather defaults to saved course coordinates.
- Route/map actions prefill from saved course context where meaningful.
- Scorecard remains functional.

- [ ] Write failing tests for trip-hub helper/view-model behavior: rich course, legacy course, missing coordinates.
- [ ] Verify RED.
- [ ] Organize Trip Details into clear summary, course/location, weather, map/route action, and scorecard sections.
- [ ] Use coordinate weather requests when available; fall back cleanly for legacy data.
- [ ] Add explicit loading/error/empty states rather than console-only failures for user-facing trip integrations.
- [ ] Preserve ScoreCard behavior and ownership constraints.
- [ ] Run client tests/lint/build and root CI commands.
- [ ] Commit: `refactor: unify saved trip experience`.

### Task 6: Fix destructive Saved Trips UX and Guest Demo copy

**Files:**
- Modify: `client/src/components/TripList/TripList.tsx`
- Modify: `client/src/components/TripList/TripList.css`
- Modify: `client/src/components/GuestDemoButton.utils.ts`
- Test: `client/src/components/TripList/TripList.test.tsx` or helper tests
- Test: `client/src/components/GuestDemoButton.test.ts`

**Interfaces:**
- Individual deletes require an intentional action and show failure feedback.
- Bulk delete is either removed from primary UI or requires explicit confirmation and reports partial failure.
- Guest note: temporary demo data is automatically deleted after 24 hours.

- [ ] Write failing tests for exact Guest Demo copy and destructive-action confirmation/error helper behavior.
- [ ] Verify RED.
- [ ] Correct Guest Demo copy.
- [ ] Replace silent delete failures with visible feedback.
- [ ] Demote or remove the one-click `Delete All Trips`; if retained, require explicit confirmation and disable while running.
- [ ] Run client test suite/lint/build.
- [ ] Commit: `fix: make temporary and destructive actions clear`.

### Task 7: Unify navigation and lightweight visual system

**Files:**
- Modify: `client/src/App.css`
- Modify: `client/src/components/Header/Header.tsx`
- Modify: `client/src/components/Header/Header.css`
- Modify: `client/src/pages/Home/Home.tsx`
- Modify: `client/src/pages/Home/Home.css`
- Modify affected page CSS files conservatively.
- Create: `client/src/styles/tokens.css` if App structure supports a shared import.
- Add pure navigation/guest-state tests where useful.

**Interfaces:**
- Logged-out Home prioritizes product explanation -> Guest Demo -> Login; invite signup remains secondary.
- Logged-in Home prioritizes Plan Trip / Saved Trips and does not duplicate unrelated mini-app workflows.
- Primary navigation uses consistent labels and touch targets.

- [ ] Add failing tests for any extracted navigation/view-model logic needed to distinguish logged-in/guest/logged-out primary actions.
- [ ] Verify RED.
- [ ] Add shared CSS tokens for color/spacing/type/radius/surface states.
- [ ] Simplify Home hierarchy and remove duplicate route/course mini-workflow clutter from the landing screen.
- [ ] Keep Course Finder, Routing, Weather accessible as secondary tools.
- [ ] Improve 320/360/375/390px wrapping/touch targets in Header, Trip List, Plan Trip, Trip Details.
- [ ] Run client tests/lint/build and full root validation.
- [ ] Commit: `refactor: simplify navigation and visual system`.

### Task 8: Reconcile Handicap and remove verified stale dependencies/code

**Files:**
- Modify: `client/src/pages/Handicap/HandicapAPI.ts`
- Modify: `client/src/pages/Handicap/HandicapTracker.tsx`
- Remove `LocalHandicapData.ts` only after no production import remains.
- Modify: root/client `package.json` and lockfiles only after import searches prove unused dependencies.
- Add/modify handicap tests.

**Interfaces:**
- Handicap course lookup uses the server GolfCourseAPI proxy or persisted course metadata rather than permanent `USE_API=false` local mode.
- Provider response shape matches the actual proxy.

- [ ] Add failing tests around GolfCourseAPI response normalization and persisted course identity usage.
- [ ] Verify RED.
- [ ] Remove the permanent local/live toggle from normal application flow.
- [ ] Correct the detail-response contract to the real proxy payload.
- [ ] Prefer persisted provider ID/rating/slope when already known; fall back to server search when not.
- [ ] Search branch source for overlapping Google Maps libraries and other stale dependencies; remove only those with zero runtime/build/test references.
- [ ] Search for `Course` model usage before deciding whether standalone Course model is truly stale; do not delete if uncertain.
- [ ] Do not touch Atlas `pings`; record it as an external cleanup candidate only.
- [ ] Run full CI validation.
- [ ] Commit: `refactor: reconcile handicap and stale client code`.

### Task 9: Final regression and deployment-readiness report

**Files:**
- Modify: `HANDOFF.md` or create `docs/refactor-verification.md`.
- No production behavior should be introduced in this task.

**Interfaces:**
- Produces a verified branch status distinguishing committed/pushed/merged/deployed.
- Records Atlas changes required later, if any, without applying them.

- [ ] Run the full GitHub Actions workflow on final branch head and verify success.
- [ ] Compare branch against `auth-invite-guest`; inspect every changed file for accidental secret/data/deployment changes.
- [ ] Verify Render still points at `main` and no deployment occurred.
- [ ] Re-run read-only Atlas collection/index counts to prove no implementation-time mutation occurred.
- [ ] Document remaining approved-later items: seven dangling Profile trip refs, production Guest TTL/index verification after deployment, possible `ownerId` migration, possible HttpOnly-cookie auth project.
- [ ] Commit: `docs: record Fairway Finder refactor verification`.

## Safest execution order

Tasks 1-3 establish correct durable data semantics before any broad architecture or UX work. Task 4 then centralizes providers without changing public contracts. Tasks 5-7 make the UI reflect the corrected data flow. Task 8 removes prototype debt only after the core path is stable. Task 9 proves branch safety and stops before merge/deploy.
