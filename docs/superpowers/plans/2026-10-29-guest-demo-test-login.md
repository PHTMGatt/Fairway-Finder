# Guest Demo / Test Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing temporary Guest Demo into an isolated, seeded, resettable test login that exercises Fairway Finder without real-user data.

**Architecture:** Preserve the existing per-visitor guest profile and TTL model. Add a focused server helper that seeds canonical fake trip/player/score data, invoke it when a guest session starts, expose a guest-only reset mutation, and wire the client to land on seeded My Trips with a Demo Mode reset control.

**Tech Stack:** React 18, TypeScript, Apollo Client/GraphQL, Node/Express/Apollo Server, MongoDB/Mongoose, Node test runner, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-guest-demo-test-login-design.md`

## Global Constraints
- Work only on `PHTMGatt/Fairway-Finder` branch `chatgpt-forge`.
- Preserve MongoDB/Mongoose; no Supabase migration.
- Never expose, copy, or modify real-user data.
- No shared writable permanent demo account.
- No direct-main merge and no production deploy.
- Keep the approved dark fairway-green UI baseline.
- Demo Mode must remain usable on desktop, portrait phone, and landscape phone.

## Review Focus
- A permanent authenticated user calling reset must receive an error and retain every existing trip.
- Two simultaneous guest starts must create different profiles and different seeded trips.
- A reset after the guest has created/edited trips must delete only that guest's old guest trips and restore one canonical seed trip.
- Seeded trip/player scores must satisfy existing validators and Trip schema assumptions.
- Demo banner/reset controls must not overflow on narrow portrait or shallow landscape layouts.

---

### Task 1: Seed and reset isolated guest data

**Files:**
- Create: `server/src/utils/guestDemoSeed.ts`
- Modify: `server/src/schemas/resolvers.ts`
- Modify: `server/src/schemas/typeDefs.ts`
- Test: `server/test/guest-session.test.mjs`

**Interfaces:**
- Produces: `seedGuestDemoTrip(profile): Promise<TripDoc>` and `resetGuestDemoData(profile): Promise<TripDoc>`.
- Produces GraphQL mutation: `resetGuestDemo: Profile`.

- [ ] **Step 1: Write failing server tests**
  - New guest starts with exactly one seeded guest trip containing one course, two players, and sample score data.
  - Two guests receive distinct seeded trip IDs and profile ownership.
  - Reset restores exactly one canonical seed trip after guest data is changed.
  - Permanent account reset is rejected and leaves permanent trips unchanged.

- [ ] **Step 2: Run server tests and verify RED**
  Run: `npm test --prefix server -- guest-session.test.mjs`
  Expected: FAIL because seeded trip/reset mutation does not exist.

- [ ] **Step 3: Implement guest demo seed helper**
  - Generate a date seven days from session creation.
  - Create one `isGuest: true` trip with the same `expiresAt` as the profile.
  - Use fake trip/course/player/score data only.
  - Link the seed trip only to the supplied guest profile.
  - Reset must clear the current guest trip refs first, delete only those referenced `isGuest: true` trips, then seed again.

- [ ] **Step 4: Wire GraphQL start/reset**
  - `startGuestSession` seeds before signing/returning the token.
  - `resetGuestDemo` requires `profile.isGuest === true`; permanent users fail before writes.

- [ ] **Step 5: Run server suite and verify GREEN**
  Run: `npm test --prefix server`
  Expected: PASS.

### Task 2: Demo login and reset UX

**Files:**
- Modify: `client/src/utils/mutations.ts`
- Modify: `client/src/components/GuestDemoButton.tsx`
- Modify: `client/src/components/GuestDemoButton.utils.ts`
- Modify: `client/src/components/GuestDemoButton.test.ts`
- Modify: `client/src/pages/Auth/Login.tsx`
- Modify: `client/src/components/Header/Header.tsx`
- Modify: `client/src/components/Header/Header.css`
- Modify: `client/src/components/GuestDemoButton.css`

**Interfaces:**
- Consumes: GraphQL `resetGuestDemo` mutation from Task 1.
- Produces: guest default destination `/saved-trips`; visible Demo Mode banner with Reset Demo action.

- [ ] **Step 1: Write failing client tests**
  - Guest navigation defaults to `/saved-trips`.
  - Demo note states that the session is isolated and automatically deleted after 24 hours.
  - Reset mutation document exists and targets `resetGuestDemo`.

- [ ] **Step 2: Run client tests and verify RED**
  Run: `npm test --prefix client -- --run`
  Expected: FAIL on old `/plan-trip` navigation/copy and missing reset mutation.

- [ ] **Step 3: Implement login CTA and navigation**
  - Login screen label becomes `Continue as Guest`.
  - Successful guest start lands on `/saved-trips` so seeded data is visible immediately.
  - Existing explicit destinations/states still work for other GuestDemoButton usages.

- [ ] **Step 4: Implement Demo Mode reset control**
  - Header guest banner says `Demo Mode` and retains expiry information.
  - Reset button calls `resetGuestDemo`, refreshes Apollo cache, and navigates to `/saved-trips`.
  - Show loading/error state without logging the user out.

- [ ] **Step 5: Add responsive/focus styling**
  - Portrait phone may stack banner text/action.
  - Landscape phone keeps compact horizontal banner/action when space permits.
  - Reset and Continue as Guest have visible focus states and adequate tap targets.

- [ ] **Step 6: Run client suite and verify GREEN**
  Run: `npm test --prefix client -- --run`
  Expected: PASS.

### Task 3: Full verification and PR checkpoint

**Files:**
- Modify: PR #72 description only if needed.

**Interfaces:**
- Consumes completed server/client implementation.
- Produces clean `chatgpt-forge` checkpoint only; no merge/deploy.

- [ ] **Step 1: Run full CI-equivalent verification**
  Run: `npm run lint && npm run build && npm test && npm test --prefix client -- --run`
  Expected: all commands PASS.

- [ ] **Step 2: Review branch diff from prior head**
  Confirm no `main` change, no Supabase references, no production credentials/data, and no unrelated UI rewrite.

- [ ] **Step 3: Update PR #72 summary**
  Record isolated seeded guests, reset safety, Demo Mode UI, responsive behavior, and final verification state.

- [ ] **Step 4: Freeze branch**
  Confirm `chatgpt-forge` head and PR remain open/unmerged; do not deploy.
