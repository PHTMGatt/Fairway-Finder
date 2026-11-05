# Fairway Finder Integration Refactor Design

**Date:** 2026-10-25

## Intent

Reconcile the verified Guest Demo branches without losing work, then make Fairway Finder substantially safer and more coherent by fixing correctness risks first and repairing the trip/course data flow before visual redesign.

Fairway Finder remains a private/small-group golf trip planner. Existing invite-only authentication, Guest Demo security, TTL cleanup design, rate limiting, ownership checks, and guarded remote-write tooling are preserved rather than rewritten.

## Goals

- Keep all work isolated from `main` until explicit approval.
- Preserve the screenshots and Playwright-log ignore from `auth-invite-guest`.
- Preserve the guarded invite CLI and root invite argument behavior from `gandalf/ff-guest-ux-2026-10-23`.
- Fix correctness/data-loss hazards before broader UX work.
- Make a saved Trip the canonical source of trip and selected-course facts.
- Preserve backward compatibility with existing Atlas Trip documents.
- Use small, test-backed, reversible commits and the existing GitHub Actions gate.

## Non-goals for this phase

- No production deployment.
- No merge to `main`.
- No destructive production MongoDB mutation.
- No replacement of the current auth/Guest architecture.
- No paid API/service purchase.
- No full visual redesign before the data flow is stable.

## Constraints

- Working branch: `gandalf/fairway-integration-2026-10-25`.
- Integration base: `auth-invite-guest` at `10453126afc895b1ef5dc810c71138b4451a1ff4`.
- Reconciliation carries only the verified root `package.json` tooling delta from `gandalf/ff-guest-ux-2026-10-23`.
- Production Atlas is read-only during this phase.
- Existing legacy Trip documents must continue to resolve even when new course identity fields are absent.

## Chosen approach

Use `auth-invite-guest` as the base because it already contains the real screenshots and Playwright-log ignore. Manually carry the verified root tooling delta instead of merging the diverged branch wholesale. Then fix P0 correctness issues before introducing an additive canonical TripCourse contract.

Alternative approaches considered and rejected:

1. Merge the two diverged branches directly — unnecessary merge history and more conflict surface for a one-file unique delta.
2. Cherry-pick both guest-UX commits — would duplicate changes already present on the integration base and obscure what was actually reconciled.

## P0 behavior

### Course removal

Course removal must name the owning trip and the exact embedded course. The GraphQL mutation will use `tripId` plus `courseId`; the resolver will first enforce trip ownership, then pull only the matching embedded course `_id`. Duplicate course names on different trips must never cause cross-trip mutation.

### Trip deletion

The client will remove the bulk `Delete All Trips` control during P0. Individual trip deletion will require an explicit confirmation and will display mutation failures to the user rather than swallowing them.

### Guest Demo copy

Replace the inaccurate device-only statement with: `Temporary demo data is automatically deleted after 24 hours.`

### Production integrity report

Atlas inspection remains read-only. Record the current aggregate finding that 8 profile→trip references exist, 1 resolves, and 7 are dangling. Do not delete or repair those references without explicit approval.

## Canonical TripCourse direction

The selected course should cross the full stack as a structured object rather than collapsing to `courseName`.

Additive course identity fields should include, where known:

- `source` — provider namespace such as `google`, `golfcourseapi`, or `osm`
- `providerId` — provider-native stable identifier
- `name`
- `address`
- `location { lat, lng }`
- `rating` — display/provider rating when available
- `golfCourseApiId` — resolved GolfCourseAPI identity when available
- existing `slope` / course-rating cache fields remain compatible

All new fields remain optional at the Mongo/GraphQL boundary so current production records with only a course name still work.

Plan Trip will persist the selected course object. Trip Details will prefer persisted Trip data and stop using localStorage for canonical date/location/course facts. Provider enrichment will use stored IDs when available; fuzzy name rediscovery becomes a legacy fallback only.

## Data ownership

Do not change Trip ownership architecture in this phase. `Profile.trips` remains the authorization source while P0 and canonical TripCourse are stabilized. A later, separately reviewed migration may add `Trip.ownerId` if still justified.

## Verification

Every functional slice must pass the existing GitHub Actions workflow: dependency installation, lint, client/server build, server tests, and client tests. New regressions should be added before or alongside implementation so the failure mode is pinned.
