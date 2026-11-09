# Fairway Finder API / Provider Hardening Plan

**Goal:** Harden external API behavior without changing the app's core product architecture or public REST contracts.

**Architecture:** Keep existing Express routes as orchestration boundaries. Add only shared runtime-config, HTTP-timeout, and geocoding utilities where behavior is duplicated. Preserve current preferred/fallback provider order.

**Spec:** `docs/superpowers/specs/2026-10-25-fairway-api-provider-hardening-design.md`

## Constraints

- Work only on `gandalf/fairway-integration-2026-10-25`.
- No deployment, `main` merge, paid API purchase, or production environment mutation.
- No production MongoDB writes.
- Do not make real paid/public provider calls from tests.
- Each functional slice ends with the complete GitHub Actions gate green.

### Task 1: Separate core runtime requirements from provider capabilities

**Files:**
- Create: `server/src/utils/runtimeEnvironment.ts`
- Create: `server/test/runtime-environment.test.mjs`
- Modify: `server/src/server.ts`
- Modify: `server/src/routes/courseRoutes.ts`
- Modify: `server/src/routes/mapRoutes.ts`
- Modify: `server/src/routes/golfRoutes.ts`

- [ ] RED tests prove Mongo/JWT are required while Google/Golf keys are optional capabilities.
- [ ] Server startup only fails for missing core requirements.
- [ ] Google-backed helpers skip themselves cleanly when no Places key exists.
- [ ] GolfCourseAPI discovery skips itself when no Golf key exists.
- [ ] `/api/golf/*` returns a clear 503 when the Golf key is unavailable instead of exiting the process.
- [ ] Full CI green.

### Task 2: Bound outbound provider requests

**Files:**
- Create: `server/src/services/http.ts`
- Create: `server/test/provider-http.test.mjs`
- Modify: provider route/service files using `node-fetch`

- [ ] RED test with a local HTTP server proves a slow request is aborted by timeout.
- [ ] RED test proves normal local HTTP response succeeds.
- [ ] Implement shared `fetchWithTimeout` with `AbortController` and cleanup.
- [ ] Replace raw provider `fetch` calls in course/weather/map/golf/location code.
- [ ] Preserve current client-facing fallback/error behavior.
- [ ] Full CI green.

### Task 3: Consolidate geocoding and control Nominatim use

**Files:**
- Create: `server/src/services/geocoding.ts`
- Create: `server/test/geocoding.test.mjs`
- Modify: `server/src/routes/courseRoutes.ts`
- Modify: `server/src/routes/mapRoutes.ts`

- [ ] Extract shared coordinates/types and provider-order behavior.
- [ ] Add bounded in-memory cache keyed by normalized query.
- [ ] Serialize Nominatim calls to avoid intentionally exceeding one request per second in the single process.
- [ ] Preserve Fairway Finder User-Agent and US scoping.
- [ ] Replace duplicate route-local Google/Nominatim geocoders.
- [ ] Full CI green.

### Task 4: Fix dormant Handicap API contract mismatch

**Files:**
- Modify: `client/src/pages/Handicap/HandicapAPI.ts`
- Add/update focused client tests.

- [ ] RED test proves `getCourseById` accepts the direct provider response returned by `/api/golf/:id`.
- [ ] Remove the incorrect `{ course: CourseDetails }` assumption.
- [ ] Keep local mode behavior intact; do not enable live mode solely as part of this contract fix.
- [ ] Full CI green.

### Task 5: Provider phase checkpoint

- [ ] Compare integration branch against prior P0/TripCourse checkpoint.
- [ ] Confirm no production Atlas writes.
- [ ] Confirm Render remains on `main`, auto-deploy off.
- [ ] Record what remains: route/service decomposition, caching policy expansion, trip-date forecast, UX/navigation, responsive/design, performance/dependencies.
- [ ] Full CI green.
