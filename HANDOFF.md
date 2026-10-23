# Fairway Finder — Authoritative Handoff

**Updated:** 2026-10-23  
**Active implementation branch:** `gandalf/ff-guest-ux-2026-10-23`  
**Integration target:** `auth-invite-guest`  
**Production status:** **NOT DEPLOYED** from this work. Production MongoDB data was inspected read-only and was not modified.

## Verified checkpoint

Code checkpoint `b16a6d06057c6083fbfb2908fb7c281d071f0e03` passed GitHub Actions end to end:

- Lint: **0 errors / 0 warnings**
- Client + server production build: **PASS**
- Server tests: **50 / 50 PASS**
- Client tests: **15 / 15 PASS** across 6 Vitest files
- MongoDB index-readiness test: **PASS**

The dependency install still reports inherited npm audit findings. Do **not** use `npm audit fix --force` blindly; dependency remediation needs its own compatibility-tested pass.

## Current product direction

Fairway Finder is a private/small-group golf trip application, not a public social network. Normal accounts are invite-only. A temporary **Guest Demo** lets someone try the app without creating a permanent account.

### Guest Demo behavior

- Guest lifetime: **24 hours**
- Guest token expires no later than the guest profile
- Guest identity is marked with `isGuest: true`
- Guest profile and guest trips carry the same `expiresAt`
- Maximum guest trips: **3**
- Guest creation is rate-limited and subject to a site-wide active-guest cap
- Guests cannot log in later with a password
- Expired guests are rejected immediately, even before MongoDB TTL cleanup runs
- MongoDB TTL indexes delete expired guest profiles/trips
- A server cleanup sweep remains as a backup cleanup mechanism
- Permanent profiles/trips do not receive guest expiry fields

### Client Guest Demo UX now implemented

- `Try as Guest` is available on Login and the logged-out Home state
- Guest start uses `startGuestSession`, stores the returned token, refreshes auth state, and lands on **Plan Trip**
- Header shows guest expiry time and a warning with less than two hours remaining
- Expired guest sessions are distinguished from normal session expiry on Login
- Apollo only treats GraphQL `UNAUTHENTICATED` responses as auth expiry
- Logout/auth expiry clears Apollo cache before redirecting
- Scorecard mutation errors display inline
- Hole score input is capped at the server-supported maximum of **30**

## MongoDB / Atlas rollout state

The production Atlas cluster was checked read-only before any deployment:

- Existing production documents are permanent/legacy data; no guest fields were observed
- No guest TTL indexes currently exist in production
- No invites collection currently exists in production
- No open Atlas alerts were reported
- Atlas Performance Advisor returned no current index/schema/slow-query recommendations
- No production documents or indexes were created, changed, or deleted during this work

The server now exports `initializeModelIndexes()` and **awaits it before Guest Demo cleanup/server startup**. It uses Mongoose `createIndexes()` for `Profile`, `Trip`, and `Invite`, which creates the schema-declared guest TTL and invite uniqueness indexes without dropping unrelated existing indexes.

The new regression test explicitly verifies:

- Profile `expiresAt` TTL index: `expireAfterSeconds: 0`, partial filter `{ isGuest: true }`
- Trip `expiresAt` TTL index: same guest-only TTL behavior
- Invite `codeHash` index: unique

## Security / compatibility work already complete

- Strong JWT secret requirement
- Expired/tampered/wrong-secret/unsigned tokens rejected
- Login timing equalization for unknown email vs wrong password
- Login rate limiting
- API rate limiting
- Render-aware trust-proxy handling with a safe override
- Invite-only signup
- Invite code stored hashed, not plaintext
- Invite reservation/rollback prevents accidental invite loss on rejected signup
- Concurrent reuse of one invite creates only one account
- Guest-like permanent usernames/emails are reserved
- Trip ownership is enforced consistently
- Someone else's trip is indistinguishable from a missing trip
- Existing legacy permanent users remain compatible
- Input limits for names, scores, handicaps, players, and courses
- CLI guards prevent accidental remote seed/invite writes unless explicitly allowed
- Test databases use `mongodb-memory-server`, not production MongoDB

## CI

`.github/workflows/main.yml` now runs on pushes and pull requests and checks:

1. dependency installation
2. lint
3. client + server build
4. server test suite
5. client Vitest suite

Current CI install is slower than necessary because root `npm install` also invokes the repository's install lifecycle and the workflow then installs subprojects explicitly. This is a cleanup opportunity, not a release blocker.

## Remaining production gates — do these in order

1. **Create a production database backup** before enabling the new schema/index behavior.
2. Confirm the correct Render workspace/service before touching deployment settings.
3. Re-run the read-only Atlas preflight immediately before deployment.
4. Deploy the verified feature branch — do not jump straight to an unverified `main` merge.
5. Confirm startup logs show MongoDB connection and index readiness before traffic is accepted.
6. Verify `/health`.
7. Temporarily enable the existing client-IP diagnostic if needed and verify Render's trusted proxy behavior, then disable it again.
8. Smoke-test a real Guest Demo: create guest → create trip → verify limits/expiry metadata → log out.
9. Re-check Atlas indexes after deployment and confirm the two guest-only TTL indexes plus invite uniqueness index exist.
10. Only after the production smoke test is clean should this work be merged to `main`.

## Known non-blocking follow-ups

- Saved Trips has a known narrow-phone horizontal overflow issue around 375px that still needs a focused responsive pass.
- Root `seed` script naming/path is stale and should be reconciled with the guarded seed tooling.
- npm audit reports significant inherited dependency debt; remediate deliberately with tests, not force-upgrades.
- CI's install step is redundant/slow and can be simplified later.
- Large decorative GIF assets remain an optimization opportunity.

## Do not repeat

- Do not test guest TTL or invite behavior against production MongoDB.
- Do not run seed/invite write tools against a remote DB without explicit intent and the remote-write guard.
- Do not use `syncIndexes()` or manually drop production indexes as a shortcut; startup uses additive `createIndexes()`.
- Do not treat arbitrary network errors as authentication expiry.
- Do not deploy before a backup and production smoke plan are ready.
- Do not run `npm audit fix --force` without reviewing breaking dependency changes.
