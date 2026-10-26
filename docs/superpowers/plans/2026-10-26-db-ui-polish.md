# Fairway Finder DB + UI Polish Plan

## Goal
Harden the existing data model without production writes, then improve high-value trip-planning usability without redesigning the app.

## Constraints
- Work only on `gandalf/fairway-db-ui-polish-2026-10-26`.
- No merge to `main`.
- No Render deployment.
- Production Atlas remains read-only.
- Preserve the current Profile→Trip ownership model for this pass.
- Use test-first changes for behavior.

## Task 1 — Read-only repair preview
1. Add a failing integrity test requiring dangling references to be grouped into an exact cleanup preview by profile.
2. Implement a pure read-only preview builder from the integrity report.
3. Surface the preview from the existing integrity command without adding any write operation.
4. Run the server/full CI gate.

## Task 2 — Plan Trip form usability
1. Add regression coverage for trip-form readiness/validation behavior.
2. Make required fields explicit and improve disabled/save guidance without changing the GraphQL contract.
3. Tighten phone interaction/accessibility where evidence supports it.
4. Run client/full CI.

## Task 3 — Verify
- Review branch diff against its base.
- Confirm no production DB mutation, deployment, or main merge occurred.
- Confirm latest CI status before calling the branch green.
