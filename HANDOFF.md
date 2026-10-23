# Fairway Finder — Handoff: `auth-invite-guest`

Snapshot date: 2026-10-23. Branch `auth-invite-guest`, 19 commits ahead of `origin/main`, 0 behind.
Last code commit: `241d392` (tag `checkpoint/pre-tooling-2026-10-21`). Do **not** merge to `main` until the
remaining steps below are done and the pre-deploy checklist has been run.

## Status at a glance

| Check | Result |
|---|---|
| `npm test` (server, in-memory MongoDB) | **49 / 49 pass**, 0 fail |
| Client tests | none exist (vitest is configured, no test files) |
| `npm run build` (server `tsc` + client `tsc && vite build`) | **passes** |
| `npm run lint` | **0 errors, 0 warnings** (the pre-existing unused `error` var in `server/src/config/connection.ts` was fixed) |

## What this branch does

The plan has 10 steps plus a hardening step (7b). Steps 1–8 are done. Steps 9–10 remain.

1. **Hygiene**: stop tracking `server/dist`, jsonwebtoken ^9, seed hashes passwords and refuses non-local DBs.
2. **Login**: one generic error for unknown email and wrong password, with equal timing. Duplicate-key (E11000) errors map to friendly messages.
3. **Rate limits** (per IP, in-memory): login 10 per 15 min, sign-up 5 per hour, guest start 3 per hour, `/api/*` 120 per min (429 + `Retry-After`). `trust proxy` is 1 hop in production and off elsewhere.
4. **Invites**: `Invite` model (only the SHA-256 hash is stored) plus the `npm run invite` CLI.
5. **Invite-only sign-up**: `ProfileInput.inviteCode` is required. The invite is claimed atomically and released if account creation fails. New passwords must be 8–72 bytes; legacy accounts still log in.
6. **Sign-up UI**: invite field, prefilled from `/signup?invite=<code>`.
7. **Guest fields + TTL**: optional `Profile.isGuest/expiresAt` and `Trip.isGuest/expiresAt`, with no defaults. TTL indexes are partial on `{ isGuest: true }`.
7b. **Hardening**: the invite is checked before "email already in use" is revealed. Someone else's trip returns "Trip not found". Input bounds live in `utils/validate.ts`. `guest-*` names and `@guest.invalid` emails are reserved.
8. **Guest sessions (server)**: `startGuestSession`, 7-day permanent sessions, guest token capped at guest expiry, backup sweep.

## Guest Demo behavior (server, done)

- `mutation startGuestSession: Auth` creates an anonymous profile `guest-<24 hex>` / `<hex>@guest.invalid` with a random unusable password, `isGuest: true`, `expiresAt = now + 24h`.
- The returned JWT expires at the guest's `expiresAt`, never later. The payload carries `isGuest: true` for UI use only; the server always checks the DB record.
- Limits: 3 guest starts per IP per hour; a site-wide cap of active guests (`GUEST_MAX_ACTIVE`, default 200, error code `GUEST_CAPACITY`); max 3 trips per guest.
- Guests can never log in by password. An expired guest is refused immediately, even before TTL deletion runs.
- Deletion: MongoDB TTL removes guest profiles and trips at `expiresAt`, usually within about 60s. `utils/guestCleanup.ts` also sweeps every 15 min. Its filters always require `isGuest: true` and a past `expiresAt`, so permanent data can't match.
- No guest-to-account conversion (product decision).
- **Client UI for guests is NOT built yet** (step 9).

## Auth / invite behavior

- Permanent accounts are invite-only. Create invites with the CLI and share the code or link. The code is printed once and cannot be recovered.
- Invites are single-use and expire (default 7 days, max 90). They can be locked to one email (case-insensitive).
- Invalid, used, expired or wrong-email invites are rejected before any "email taken" message, so the sign-up form can't be used to probe whether an email is registered. A rejection does not use up the invite.
- Concurrent sign-ups on one invite create exactly one account.
- The JWT is HS256 and sent as `Authorization: Bearer <token>`. The client keeps it in `localStorage` (`id_token`). Invalid or expired tokens are treated as anonymous and never silently renewed.

## Session expiry

- Permanent users: the token expires **7 days** after login (`SESSION_TTL_SECONDS`). There is no refresh, so the user signs in again.
- Guests: the token expires at the guest's `expiresAt` (24h after start).
- Client today: `utils/auth.ts` treats an expired token as logged out at check time. There is no global handler yet that logs out on a server `UNAUTHENTICATED` error (step 9).

## Database architecture

MongoDB through Mongoose 8 only. Collections:
- `profiles`: name, email (unique), bcrypt password, `trips[]` refs, optional `isGuest`, `expiresAt`. Partial TTL index `{expiresAt:1}` where `isGuest: true`.
- `trips`: name, date, courses, players (scores, handicap), optional `isGuest`, `expiresAt`. Same partial TTL index.
- `invites`: `codeHash` (unique), `email|null`, `expiresAt`, `usedAt`, `usedBy`, `note`, timestamps.
- `courses`: cached course data, index on `location.lat/lng`.

Indexes are created by Mongoose `autoIndex` on startup. **TTL index options cannot be changed in place**: changing them later means dropping `expiresAt_1` by hand first.

Safety rules (keep them):
- Tests only ever run on `mongodb-memory-server` on 127.0.0.1 and refuse anything else.
- The seed refuses `NODE_ENV=production` and non-local hosts unless `ALLOW_REMOTE_SEED=true`.
- The invite CLI refuses non-local hosts unless `--allow-remote` is passed.
- Never point dev or test tooling at the production Atlas cluster.

## Environment / config (names only)

`server/.env`, loaded by `server.ts` from the `server/` directory:
- Required: `MONGODB_URI`, `JWT_SECRET_KEY`, `PLACES_API_KEY`, `GOLF_API_KEY`
- Optional: `PORT` (default 3001), `NODE_ENV`, `TRUST_PROXY` (hop count / `true` / `false`), `DEBUG_CLIENT_IP` (`true` enables `GET /api/debug/client-ip`), `GUEST_MAX_ACTIVE` (default 200)
- Seed only: `ALLOW_REMOTE_SEED`
- Tests only, optional: `MONGOMS_DOWNLOAD_DIR` (reuses a cached mongod binary; the first download is large)

`client/.env`: `VITE_GOOGLE_MAPS_API_KEY`

Placeholder layout: see `README_FairwayFinder_API_Setup.md`. Never commit `.env` files (they're gitignored).

## Unfinished work

**Step 9: Guest + session UX (client)**
- Apollo error link: only `UNAUTHENTICATED` (never network errors) calls `logoutUser()` and `client.clearStore()`, then redirects to `/login?reason=expired|guest_expired`. Login shows a matching message.
- Logout clears the Apollo cache.
- ScoreCard shows save errors inline. Also add `max` on its score input, since the server now rejects scores above 30.
- "Try as Guest" goes below the Login form and in Home's locked box. Guests land on Plan Trip. Copy: "stays on this device, deleted after 24h".
- Header guest banner shows the end time, in warning style when under 2h are left.
- Add `startGuestSession` (and `isGuest expiresAt` on profile queries) to `client/src/utils/mutations.ts` / `queries.ts`.

**Step 10: Docs, CI, rollout**
- README: env vars, invite CLI, guest behavior. This file covers it for now.
- CI (`.github/workflows/main.yml`) runs **lint only** (now passing). Enable build and `npm test` too.
- Log or await index builds at startup, or add a guarded index script.
- Pre-deploy checklist, read-only on production and run by the owner:
  - Profiles/trips with `expiresAt` or `isGuest` set = 0.
  - No `guest-` names or `@guest.invalid` emails exist.
  - List existing indexes.
  - Take a backup (Atlas snapshot or `mongodump`).
  - After deploy, verify `/api/debug/client-ip` on Render, then turn `DEBUG_CLIENT_IP` off.
- Rollback: redeploy the previous build. If needed, drop the `expiresAt_1` indexes by hand.

**Later polish roadmap (P1–P8):**
- P1: delete confirmations; trip date stored on the server.
- P2: 375px layout fix and CSS dedupe.
- P3: a single `RequireAuth` gate.
- P4: bottom tab bar.
- P5: round-mode scorecard.
- P6: one planning flow.
- P7: handicap from real rounds.
- P8: shared loading/error/offline states.

## Known bugs / issues

- **`npm run seed` is broken**: the root script calls `server`'s `seed` script, which doesn't exist (also true on `main`). `seed.ts` also uses extensionless ESM imports. Seeding isn't needed for the invite flow.
- Rate-limit counters are in-memory per process. They reset on restart and aren't shared across instances, which is fine for one Render instance.
- CORS origin is hard-coded to `http://localhost:3000`. Production serves the client same-origin, so this only matters for other setups.
- `removeCourseFromTrip(courseName)` takes no `tripId` (pre-existing API shape).
- The Saved Trips page overflows horizontally at 375px (P2).
- The client doesn't react to server-side session expiry until step 9.

## Important files

Server:
- `server/src/schemas/resolvers.ts`: auth, invite, guest and trip resolvers; ownership checks
- `server/src/schemas/typeDefs.ts`: GraphQL schema
- `server/src/utils/auth.ts`: `signToken`, `authenticateToken`, `SESSION_TTL_SECONDS`
- `server/src/utils/guest.ts`: guest identity, TTL, limits
- `server/src/utils/guestCleanup.ts`: backup sweep
- `server/src/utils/rateLimit.ts`: limiters and trust proxy
- `server/src/utils/validate.ts`: input bounds
- `server/src/utils/dbTarget.ts`: local vs remote DB detection
- `server/src/models/Invite.ts`, `Profile.ts`, `Trip.ts`
- `server/src/scripts/createInvite.ts`: invite CLI
- `server/src/server.ts`: Express/Apollo wiring and env checks
- `server/test/*.test.mjs` plus `helpers.mjs`: test suite

Client:
- `client/src/pages/Auth/Signup.tsx`
- `client/src/pages/Auth/Login.tsx`
- `client/src/pages/Auth/AuthContext.tsx`
- `client/src/utils/auth.ts`
- `client/src/utils/mutations.ts`
- `client/src/App.tsx`

## Resume development

```bash
git clone https://github.com/PHTMGatt/Fairway-Finder.git
cd Fairway-Finder
git checkout auth-invite-guest

# Install (root "install" script also installs server/ and client/)
npm install

# Env: create server/.env and client/.env with the variable NAMES listed above
# (see README_FairwayFinder_API_Setup.md). Use a LOCAL MongoDB, e.g. mongodb://127.0.0.1:27017/fairway-dev

# Dev (server on :3001 with tsc --watch + nodemon, Vite client on :3000 proxying /graphql and /api)
npm run start:dev

# Create an invite against the local DB (server must be built first)
npm run build
cd server && npm run invite -- --days 7 --base-url http://localhost:3000 && cd ..

# Test (builds the server, then runs node:test on in-memory MongoDB; no .env needed)
npm test

# Production build
npm run build

# Lint (what CI runs)
npm run lint
```
