# Fairway Finder P0 + TripCourse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reconciled, green integration baseline; remove P0 correctness/data-loss hazards; then make selected-course data persist coherently from course search through Trip Details.

**Architecture:** Preserve the existing React/Apollo/Express/Mongoose stack and auth/Guest security model. Make changes additively at the GraphQL/Mongo boundary so legacy trips still work, and migrate client behavior away from localStorage/fuzzy course rediscovery only after the richer TripCourse contract is available.

**Tech Stack:** React 18, TypeScript, Vite, Apollo Client/Server GraphQL, Express, Mongoose/MongoDB Atlas, Node test runner, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-25-fairway-integration-refactor-design.md`

## Global Constraints

- Work only on `gandalf/fairway-integration-2026-10-25`.
- Do not merge to `main` or deploy without explicit approval.
- Do not write/delete production Atlas data during this plan.
- Preserve existing invite-only auth, Guest Demo TTL/security, rate limiting, and ownership architecture.
- New Mongo/GraphQL course fields must remain backward-compatible with legacy name-only Trip courses.
- Each functional slice ends with the full existing GitHub Actions gate green.

## Review Focus

- Duplicate course names across separate trips: removing one must not mutate the other trip.
- Unauthorized/missing trip IDs: course removal must return the same `Trip not found` behavior as other ownership-protected mutations.
- Destructive UI actions: cancellation must perform no mutation; mutation failure must remain visible.
- Legacy Trip documents: name-only embedded courses must still query/render after TripCourse fields are added.
- Partial provider data: a selected course may lack rating, coordinates, or provider-specific IDs and must still save successfully.

---

### Task 1: Lock the reconciled baseline

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `auth-invite-guest` baseline plus the verified root tooling delta.
- Produces: root `invite` command and retired stale root `seed` command.

- [x] Apply only the verified root `package.json` delta.
- [x] Run the complete GitHub Actions gate.
- [x] Record the green baseline commit before functional refactoring.

### Task 2: Pin and fix exact course removal

**Files:**
- Modify: `server/test/trips.test.mjs`
- Modify: `server/src/schemas/typeDefs.ts`
- Modify: `server/src/schemas/resolvers.ts`
- Modify: `client/src/utils/mutations.ts`
- Modify: `client/src/components/CourseList/CourseList.tsx`

**Interfaces:**
- Consumes: embedded course `_id` and existing `requireOwnedTrip(tripId, context)`.
- Produces: `removeCourseFromTrip(tripId: ID!, courseId: ID!): Trip`.

- [ ] Add a regression test that creates two owned trips containing the same course name, removes one embedded course by `tripId + courseId`, and asserts the other trip is unchanged.
- [ ] Add a regression assertion that another user's or missing trip returns `Trip not found` and performs no mutation.
- [ ] Update GraphQL schema to require `tripId` and `courseId`.
- [ ] Update resolver to call `requireOwnedTrip`, verify the embedded course exists on that trip, and `$pull` by embedded `_id` only.
- [ ] Update the client mutation and CourseList props/handler to pass explicit identifiers.
- [ ] Run the full CI gate and commit the slice.

### Task 3: Make trip deletion deliberately destructive

**Files:**
- Create: `client/src/components/TripList/TripList.test.tsx`
- Modify: `client/src/components/TripList/TripList.tsx`
- Modify: `client/src/components/TripList/TripList.css` only if needed for the visible error state.

**Interfaces:**
- Consumes: existing `DELETE_TRIP(tripId)` mutation.
- Produces: per-trip confirmation and visible delete error state; no bulk delete control.

- [ ] Add tests that cancellation does not invoke the delete mutation and confirmation permits one trip delete.
- [ ] Add a test that a rejected delete mutation renders an accessible error message.
- [ ] Remove `Delete All Trips` from the UI.
- [ ] Require confirmation before an individual trip delete.
- [ ] Store/display mutation errors instead of swallowing them.
- [ ] Run the full CI gate and commit the slice.

### Task 4: Correct Guest Demo data-retention copy

**Files:**
- Modify: `client/src/components/GuestDemoButton.test.ts`
- Modify: `client/src/components/GuestDemoButton.utils.ts`

**Interfaces:**
- Produces: exact shared copy `Temporary demo data is automatically deleted after 24 hours.`

- [ ] Change the existing unit expectation to the approved sentence and verify it fails before implementation.
- [ ] Update `GUEST_DEMO_NOTE` to the approved sentence.
- [ ] Run the full CI gate and commit the slice.

### Task 5: Preserve a read-only Atlas integrity checkpoint

**Files:**
- Create: `docs/audits/2026-10-25-atlas-integrity-report.md`

**Interfaces:**
- Consumes: read-only Atlas aggregates.
- Produces: a non-sensitive repair checkpoint; no database mutation.

- [ ] Re-run the read-only profile→trip aggregate immediately before recording the report.
- [ ] Record counts only: profile count, trip count, total refs, resolved refs, dangling refs, guest/expiry document counts, ownership summary, collections/index state.
- [ ] Explicitly state that no repair/delete operation was executed.
- [ ] Commit the report; CI must remain green.

### Task 6: Add the canonical TripCourse contract additively

**Files:**
- Modify: `server/src/models/Trip.ts`
- Modify: `server/src/schemas/typeDefs.ts`
- Modify: `server/src/schemas/resolvers.ts`
- Modify: `server/test/trips.test.mjs`
- Modify: `client/src/utils/mutations.ts`
- Modify: `client/src/utils/queries.ts`

**Interfaces:**
- Produces: optional structured course input/output fields while preserving legacy `name` behavior.

- [ ] Add server tests proving structured course fields persist and name-only legacy documents still query.
- [ ] Define `LocationInput` and `TripCourseInput` with optional provider/address/location/rating/provider-ID fields and required `name`.
- [ ] Change `TripInput` to carry a structured selected course while retaining a compatibility path only if needed by existing tests/client during the migration commit.
- [ ] Extend embedded Course schema with optional `source`, `providerId`, and `golfCourseApiId` fields; retain current address/location/rating/slope fields.
- [ ] Normalize and persist only provided course fields in `addTrip`.
- [ ] Expose the new fields in GraphQL queries/mutations.
- [ ] Run the full CI gate and commit the slice.

### Task 7: Persist the selected course from Plan Trip

**Files:**
- Modify: `client/src/pages/Trips/PlanTrip.tsx`
- Add focused client utility/test files if extracting provider-ID normalization improves testability.

**Interfaces:**
- Consumes: `/api/courses` result `{name,address,rating,place_id,location}` and Task 6 `TripCourseInput`.
- Produces: `ADD_TRIP` variables containing the selected course's stable identity and known metadata.

- [ ] Add tests around mapping a course-search result to GraphQL TripCourse input.
- [ ] Preserve provider source from the existing synthetic ID convention (`osm-*`, `golfcourseapi-*`, otherwise Google) without changing the API response yet.
- [ ] Send name, address, rating, location, source, providerId and GolfCourseAPI identity when determinable.
- [ ] Stop relying on navigation state as the only transport for canonical trip facts.
- [ ] Run the full CI gate and commit the slice.

### Task 8: Remove Trip Details localStorage split-brain

**Files:**
- Modify: `client/src/pages/Trips/TripDetails.tsx`
- Modify: `client/src/utils/queries.ts` if not completed in Task 6.
- Add focused utility tests for weather-location/course enrichment selection where practical.

**Interfaces:**
- Consumes: canonical persisted Trip/TripCourse fields.
- Produces: Trip Details that renders Mongo/GraphQL facts consistently across browsers.

- [ ] Render `trip.date` directly instead of localStorage `tripDate-*`.
- [ ] Derive weather location from persisted selected-course address/coordinates when possible; user-entered override may remain UI state but not canonical storage.
- [ ] Stop writing slope/course rating to localStorage.
- [ ] Prefer stored provider IDs for enrichment; retain guarded name fallback only for legacy records lacking IDs.
- [ ] Correct weather form labels/buttons while touching the flow.
- [ ] Run the full CI gate and commit the slice.

### Task 9: P0/TripCourse review checkpoint

**Files:**
- Update: `HANDOFF.md` or add a current refactor checkpoint document without rewriting historical facts.

- [ ] Compare the branch against `auth-invite-guest` and confirm only intended files changed.
- [ ] Run the full CI gate once more on the branch head.
- [ ] Verify Render still targets `main` and no deployment occurred.
- [ ] Verify production Atlas counts/integrity read-only and confirm no writes were made.
- [ ] Record remaining API/service-layer and UX work for the next plan.
