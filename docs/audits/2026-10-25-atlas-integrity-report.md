# Fairway Finder — Production Atlas Integrity Checkpoint

**Date:** 2026-10-25  
**Scope:** Read-only production-data inspection  
**Database:** `Fairway-Finder`

## Safety statement

This checkpoint records counts and structural findings only. No production MongoDB documents, collections, indexes, or configuration were created, edited, repaired, or deleted during this inspection.

The dangling trip references documented below are intentionally left unchanged. Repairing them is a production data mutation and requires separate explicit approval.

## Current collections and counts

| Collection | Documents |
| --- | ---: |
| `profiles` | 7 |
| `trips` | 1 |
| `pings` | 1 |

No production `invites` or standalone `courses` collection was present at inspection time.

## Profile → Trip reference integrity

A read-only aggregation expanded every ObjectId in `profiles.trips`, joined it to `trips._id`, and counted whether each reference resolved.

| Measure | Count |
| --- | ---: |
| Profile trip references | 8 |
| References resolving to a Trip | 1 |
| Dangling references | 7 |

The seven dangling references are an integrity defect, but they were **not repaired** in this pass.

## Trip ownership summary

The single surviving Trip was checked against profile trip-reference arrays.

| Measure | Count |
| --- | ---: |
| Trips | 1 |
| Trips with no referencing profile | 0 |
| Trips referenced by more than one profile | 0 |

The surviving Trip therefore has exactly one current profile owner under the application's existing ownership model.

## Guest Demo rollout state

Read-only profile inspection found:

- Profiles: 7
- Documents with `isGuest: true`: 0
- Documents containing `expiresAt`: 0

This matches the known deployment state: the Guest Demo feature branch has not been deployed to production.

### Current production indexes

`profiles`:
- `_id_`
- `name_1`
- `email_1`

`trips`:
- `_id_`

The guest-only partial TTL indexes declared in the feature-branch Mongoose schemas are **not present in production yet**, and no production `invites` collection exists yet. This is expected before the first Guest Demo deployment.

## Atlas health context

At the surrounding audit checkpoint:

- no open Atlas alerts were reported
- Atlas Performance Advisor returned no current suggested indexes, drop-index suggestions, schema suggestions, or sampled slow-query findings for this cluster

Those observations do not change the application-level referential-integrity defect above.

## Required safety gate before first Guest Demo deployment

1. Create/verify a production database backup.
2. Re-run this read-only preflight immediately before deployment.
3. Deploy only after explicit user approval.
4. Confirm application startup completes MongoDB index initialization before accepting traffic.
5. Smoke-test a real Guest Demo without using production as a destructive test environment.
6. Re-check production indexes and confirm:
   - Profile `expiresAt` TTL is partial to `{ isGuest: true }`
   - Trip `expiresAt` TTL is partial to `{ isGuest: true }`
   - Invite `codeHash` uniqueness exists
7. Confirm permanent documents remain without guest-expiry fields.

## Deferred repair

A future production repair can remove only profile trip-reference IDs that no longer resolve to a Trip. Before any such write, generate a fresh read-only report and present the exact affected-document count and update operation for explicit approval.
