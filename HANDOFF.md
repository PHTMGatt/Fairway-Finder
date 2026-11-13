# Fairway Finder — Project Handoff

**Updated:** 2026-11-13
**State:** `main` includes the guest demo, invite-only sign-up, email-code verification and password reset, the phone-first round flow, and the security pipeline (PRs #72–#78, all merged). Day-to-day setup and features are in [README.MD](README.MD); provider keys are in [README_FairwayFinder_API_Setup.md](README_FairwayFinder_API_Setup.md).

## Verified on 2026-11-13

- Lint: 0 errors / 0 warnings
- Server tests: 90 / 90 pass · client tests (Vitest): 65 / 65 pass
- Client + server production build: pass
- `npm audit`: server 0. Remaining moderates are the client's `react-router-dom` 6 (fix needs v7, a breaking upgrade) and dev-only ESLint tooling.

## Product rules

Fairway Finder is a private, small-group golf trip app, not a public social network. Normal accounts are invite-only (`npm run invite`). **Guest Demo** lets someone try it without an account:

- Guests last **24 hours**; guest profile, trips and token share the same `expiresAt`
- Max **3 trips** per guest; site-wide cap of **200** active guests (`GUEST_MAX_ACTIVE` overrides)
- Guest creation is rate limited; guests cannot log in later with a password
- Expired guests are rejected immediately; MongoDB TTL indexes plus a cleanup sweep remove their data
- Permanent profiles and trips never get guest expiry fields

## Security already in place

Strong JWT secret required; expired, tampered and unsigned tokens rejected; login timing equalization; login and API rate limiting; Render-aware trust-proxy handling; invite codes stored hashed with reservation/rollback; trip ownership enforced (someone else's trip looks missing); input limits on names, scores, handicaps, players and courses; CLI guards against accidental remote seed/invite writes; tests use `mongodb-memory-server`, never production data.

## Production notes

Merging to `main` is what Render deploys, so treat it as a production deploy. Startup creates the guest TTL and invite-uniqueness indexes additively (`createIndexes()`); never use `syncIndexes()` or drop production indexes. Before any deploy: back up the database, check the startup logs for MongoDB connection and index readiness, hit `/health`, and smoke-test a real guest (create guest, create trip, log out).

The Atlas state recorded on 2026-10-23 (no guest TTL indexes and no invites collection yet) was not re-checked in this sweep.

## Open items

- **Issue #64 (handicap page API and mobile layout):** the code now covers the points in the ticket (GolfCourseAPI rating/slope through `/api/golf`, saved handicap, error state, a mobile breakpoint). It has not been checked on a real phone, so the issue stays open until that is done by hand.
- Saved Trips had a narrow-phone (~375 px) horizontal overflow on 2026-10-23; not re-checked since the remaster.
- Large decorative GIF assets could be optimized.
- Client `react-router-dom` 6 → 7 upgrade (clears the remaining client advisories) needs its own tested pass.
- The local `auth-invite-guest` branch is the old integration branch; leave it alone.

## Do not repeat

- Do not test guest TTL or invite behavior against production MongoDB.
- Do not run seed or invite write tools against a remote database without explicit intent and the remote-write guard.
- Do not treat arbitrary network errors as authentication expiry.
- Do not run `npm audit fix --force` without reviewing breaking changes.
