# Fairway Finder Second UI/UX Pass — Design

## Intent
Extend the approved dark fairway-green Home/dashboard system into the real Fairway Finder product flow without redesigning Home or changing backend/database behavior.

## Goals
- Make Course Discovery feel like a purposeful golf search product with strong search hierarchy, useful rating controls, consistent result cards, and deliberate loading/empty/error states.
- Make Plan Trip, Saved/My Trips, and Trip Details read as one connected workflow from course choice through players/scores/weather/map.
- Restyle Weather and Route Planner as integrated trip utilities instead of isolated legacy widgets.
- Bring supporting auth/guest surfaces into the same visual family where high-impact inconsistencies remain.
- Preserve distinct page roles, existing routes, MongoDB/Mongoose architecture, Guest Demo behavior, and current Home implementation.
- Improve desktop, tablet, portrait phone, and landscape phone layouts with explicit overflow-safe rules and accessible focus/tap states.

## Non-goals / anti-goals
- No Home/dashboard redesign.
- No backend, schema, API-contract, auth, TTL, invite, or production-data changes unless a frontend blocker proves one unavoidable.
- No new social-network features, no generic template dashboard, no generated/AI-looking course imagery, and no fake ratings or course metadata.
- No merge to `main` and no production deployment.

## Visual approach
Use the existing `--ff-*` application tokens and Home patterns as the source of truth: deep green/black canvas, translucent layered panels, subtle green borders, bright green primary actions, high-contrast white typography, muted sage secondary copy, and restrained shadows. Pages should keep their own composition: Course Finder is a discovery/results surface; Plan Trip is a guided two-step workspace; Saved Trips is a trip hub; Weather is a forecast utility; Route Planner is a route/map workspace.

## Course Discovery behavior
Keep the current city/API search contract. Add client-only result controls that never change server behavior: rating threshold (`All`, `4.0+`, `4.5+`) and sort (`Recommended`, `Rating high-low`, `Name A-Z`). Missing ratings remain visible under `All` but are excluded by rating thresholds. Search, Maps links, authenticated Plan Trip navigation, and Guest Demo navigation remain unchanged.

## Responsive behavior
- Desktop: broad content shells and multi-column result/trip layouts.
- Tablet: two-column layouts where content remains readable; controls wrap before compression.
- Phone portrait: one-column forms/cards with full-width primary actions.
- Phone landscape: use available width with compact two-column/gridded layouts where safe, while reducing vertical padding and hero-like dead space.

## Accessibility and states
Every interactive control needs a visible `:focus-visible` state and at least ~44px tap target where practical. Loading, error, empty, selected, and disabled states use the same dark surface system and must not depend on color alone for meaning. No horizontal overflow should be introduced by grids or long names/addresses.

## Approaches considered
1. **Shared token + route-specific CSS/markup refinement (selected).** Lowest risk, preserves existing components/routes, and gives each workflow the right information hierarchy.
2. One universal dashboard shell for every page. Rejected because it would make Weather, Map, and trip forms feel artificially identical and would over-redesign the app.
3. New component library/design-system extraction before styling. Rejected for this pass because it increases refactor surface without directly improving the user journey.

## Verification
Use client unit tests for new Course Discovery filtering/sorting behavior, repository lint/build/test CI for every checkpoint, and code-level responsive/overflow review. Actual browser screenshots may only be claimed if a runnable `chatgpt-forge` preview becomes available without deploying production; otherwise report browser QA as unavailable rather than inferred from CI.
