# Fairway Finder: review pass

This branch hardens the existing app and adds reproducible tests. Live data validation and production rollout remain blocked.

## Implemented
- Missing Google Maps configuration no longer crashes the whole frontend; map unavailability has an explicit state.
- Mobile route-planner inputs now fit the viewport.
- Location autocomplete supports named combobox/listbox semantics, keyboard selection/dismissal and cancelled stale requests.
- GraphQL course removal requires an explicit owned trip ID. Frontend mutation and component updated together.
- Bounds for holes, integer scores, handicaps, calendar dates and text; duplicate player-name protection.
- Generic login errors, password length/byte bounds, safer token expiration handling and authenticated trip-detail routing.
- Removed the public signup screen's development-only "Delete All Users" button.
- Accessible auth fields and headings, skip link, route titles, reduced motion and cleaner main landmarks.
- Dependency updates include bcrypt 6, JWT 9 and router 7; removed unused `pacman`/`tree`.
- Stop tracking generated `server/dist` output; deployment must build from source.
- CI now runs lint, production builds, server tests and isolated browser checks.

## Verified locally
- Lint reports zero errors and zero warnings.
- Server/client production builds pass.
- Eight server tests pass, including cross-user trip rejection, precise course deletion targeting, validation and an existing bcrypt-5 hash fixture verified by bcrypt 6.
- 26 desktop/mobile browser checks pass using API/GraphQL fixtures. These do not prove live account, map, weather, routing, course-provider or database behavior.
- `VITE_PREVIEW_MODE=true` adds a clear review banner and blocks live signup/login. It is not set for the normal production build.

## Release gates
- MongoDB connector authentication and PostgreSQL connectivity must be repaired before real data validation.
- Final local production audits: root/client are clear; server retains four high and one moderate Apollo/GraphQL-tools/uuid advisory entries. Do not treat this branch as a security-certified production release.
- Review an Apollo server migration separately rather than force-upgrading its HTTP adapter.
- Deploy frontend/backend together because `removeCourseFromTrip` now requires `tripId`.
- No database mutation, index/schema migration, seed, production release or credential rotation was performed.
