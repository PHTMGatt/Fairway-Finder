# Fairway Finder Second UI/UX Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the approved Home dashboard visual language through Course Discovery, trip planning/hub, Weather/Map, and high-impact supporting screens without changing backend behavior.

**Architecture:** Keep existing React routes, Apollo flows, Guest Demo behavior, and API contracts. Use the global `--ff-*` tokens and route-specific CSS/markup refinements; introduce one small pure helper for client-side course filtering/sorting so behavior is testable without browser mocks.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Apollo Client, React Router, existing CSS.

**Spec:** `docs/superpowers/specs/2026-10-29-fairway-second-ui-pass-design.md`

## Global Constraints
- Work only on `PHTMGatt/Fairway-Finder` branch `chatgpt-forge`.
- Preserve Home/dashboard baseline at `8b5cae1` and valid later commits.
- Preserve MongoDB/Mongoose and all backend/database behavior.
- No merge to `main`, no production deploy, no temporary branches.
- No fake course imagery, ratings, favorites, or metadata.
- Explicit desktop/tablet/portrait-phone/landscape-phone responsive rules.

## Review Focus
- Long course/trip names and addresses must wrap without horizontal overflow.
- Missing course ratings remain visible in the default discovery view but do not pass rating thresholds.
- Guest/authenticated Plan Trip actions must keep their existing navigation behavior.
- Map/Weather empty and error states must remain useful without Google Maps or successful weather responses.
- Landscape-phone rules must use horizontal room without shrinking tap targets below practical size.

---

### Task 1: Course Discovery product surface

**Files:**
- Create: `client/src/pages/Courses/courseDiscovery.ts`
- Create: `client/src/pages/Courses/courseDiscovery.test.ts`
- Modify: `client/src/pages/Courses/CourseFinder.tsx`
- Modify: `client/src/pages/Courses/CourseFinder.css`

**Interfaces:**
- Produces `filterAndSortCourses(courses, ratingFilter, sortMode)` for the Course Finder UI.
- Preserves existing search, Google Maps links, authenticated Plan Trip, and Guest Demo navigation.

- [ ] Write tests for `All`, `4.0+`, `4.5+`, rating-descending, and name sorting; missing ratings remain in `All`.
- [ ] Verify the new tests fail before the helper exists.
- [ ] Implement the pure helper and types.
- [ ] Integrate result controls, result count/context, stronger status/empty handling, and intentional card metadata/actions.
- [ ] Restyle Course Finder to the dark discovery surface with responsive desktop/tablet/portrait/landscape behavior and visible focus states.
- [ ] Verify client tests/build and full repository CI.
- [ ] Commit a clean Course Discovery checkpoint.

### Task 2: Plan Trip and trip hub continuity

**Files:**
- Modify: `client/src/pages/Trips/PlanTrip.tsx`
- Modify: `client/src/pages/Trips/PlanTrip.css`
- Modify: `client/src/pages/Trips/SavedTrips.tsx`
- Modify: `client/src/pages/Trips/SavedTrips.css`
- Modify: `client/src/components/TripList/TripList.tsx`
- Modify: `client/src/components/TripList/TripList.css`
- Modify: `client/src/pages/Trips/TripDetails.css` only where necessary to align the existing detailed workflow.

**Interfaces:**
- Existing GraphQL mutations/queries and route state remain unchanged.
- Trip cards continue to link to `/trip/:id` and delete through the existing mutation helper.

- [ ] Reframe Plan Trip visually as a connected two-step golf-trip workspace without changing submission behavior.
- [ ] Upgrade course result/selected-course states, form hierarchy, save readiness, and responsive landscape layout.
- [ ] Turn Saved Trips into a real trip hub with an intentional header/CTA and improved loading/error/empty presentation.
- [ ] Restyle TripList cards for upcoming-trip scanning, safe long-content wrapping, destructive-action separation, and accessible focus/tap states.
- [ ] Align Trip Details surfaces with the dark system without restructuring the working feature flow.
- [ ] Verify client tests/build and full repository CI.
- [ ] Commit a clean trip-flow checkpoint.

### Task 3: Weather and Route Planner integration

**Files:**
- Modify: `client/src/pages/Weather/Weather.tsx`
- Modify: `client/src/pages/Weather/Weather.css`
- Modify: `client/src/pages/Routes/MapRouting.tsx`
- Modify: `client/src/pages/Routes/MapRouting.css`

**Interfaces:**
- Preserve `/api/weather` request behavior, temperature toggle, route prefill, filters, external Google Maps fallback, and map capability checks.

- [ ] Remove development-only console output from Weather while preserving error behavior.
- [ ] Recompose Weather as a golf-day utility with clear city/condition/temperature hierarchy and compact metric cards.
- [ ] Recompose Route Planner as a trip-route workspace with deliberate origin/destination controls, POI chips, empty/fallback states, and map framing.
- [ ] Add tablet/portrait/landscape rules that keep map/weather controls usable and overflow-free.
- [ ] Verify build/CI and commit a clean utility checkpoint.

### Task 4: Supporting-surface sweep and final verification

**Files:**
- Inspect and modify only high-impact mismatches in `client/src/pages/Auth/**`, Guest Demo component styles, and other directly exposed supporting pages.
- Do not change Home unless a shared regression requires a tiny compatibility fix.

**Interfaces:**
- Preserve all auth, Guest Demo, redirect, and route behavior.

- [ ] Fix obvious light-surface leakage, weak focus/tap states, compression, dead space, and inconsistent error/empty presentation.
- [ ] Inspect CSS for max-width/grid/min-width rules that can create horizontal overflow at tablet, portrait phone, and landscape phone sizes.
- [ ] Run client tests, client build, root lint/build/tests through GitHub Actions on final head.
- [ ] Review the final diff against the spec; self-review because no subagent is permitted for this project.
- [ ] Update PR #72 with the second-pass scope and verification state.
