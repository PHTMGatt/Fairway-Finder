# Guest Demo / Test Login Design

## Intent
Make Fairway Finder testable from the deployed login screen without requiring a real account, while guaranteeing that demo activity cannot expose, mutate, or collide with real-user data.

## Goals
- Keep MongoDB/Mongoose and the existing Guest Demo authentication model.
- Give every visitor an isolated temporary guest profile rather than one shared writable account.
- Seed each new guest with a complete fake/sample trip so Trip Details, Weather, Route, Players, and Scores are immediately testable.
- Keep Find Course and Plan Trip fully usable so the normal end-to-end product flow can still be exercised.
- Make the guest dataset safely resettable to the canonical seed state.
- Clearly display Demo Mode and the automatic cleanup policy.
- Match the approved dark fairway-green UI on desktop, portrait phone, and landscape phone.

## Non-goals
- No Supabase migration.
- No permanent/shared production demo credentials.
- No production deploy or main-branch merge.
- No access to or reuse of real-user trips/profile data.
- No new production course-provider behavior.

## Existing Safety Foundation
The current app already creates random `guest-*` profiles with `@guest.invalid` emails, blocks password login for guests, expires guest profiles and guest trips after 24 hours, limits guest trip creation, and uses TTL cleanup plus an expiry guard. The new work extends this model instead of replacing it.

## Chosen Architecture
Each click on Continue as Guest creates a fresh temporary guest profile. During creation, the server seeds one canonical demo trip owned only by that profile. The sample trip contains fake trip/player/score data and non-sensitive public-location context so Weather and Route can be exercised without real-user data.

A new authenticated `resetGuestDemo` mutation is guest-only. It atomically clears that guest profile's current trip references, deletes only the referenced `isGuest: true` trip documents, and reseeds the canonical demo trip. Permanent profiles are rejected before any write.

The client lands a new guest on My Trips so the seeded sample is immediately visible. The global guest banner is relabeled Demo Mode and adds a Reset Demo button. Reset refreshes Apollo state and returns to My Trips. The login button copy becomes Continue as Guest and remains visually prominent.

## Seed Contract
The canonical demo trip uses:
- a generated date seven days after session creation
- one fake demo course located around Ann Arbor, Michigan for weather/map context
- two fake players with complete 18-hole sample scores and handicaps
- guest flags and `expiresAt` copied exactly from the owning profile

No permanent profile IDs, emails, names, trips, or scores are copied into demo data.

## Safety Invariants
- `resetGuestDemo` requires an authenticated, unexpired guest profile.
- Permanent users receive an authorization/user-input failure and no writes occur.
- Reset deletion is restricted to IDs previously owned by that guest profile and `isGuest: true` trips.
- Seeded trips inherit the guest expiration timestamp.
- New guest sessions remain unique per visitor; simultaneous visitors never write to the same profile.
- Existing site-wide guest capacity and per-IP rate limits remain in force.

## Responsive UX
The Demo Mode banner must keep the status and reset action visible without overflowing. Portrait phones may stack the status/action; landscape phones keep a compact horizontal layout when space permits. Login guest CTA remains full-width inside the auth card and uses the existing dark green focus/tap language.

## Approaches Considered
1. Shared permanent demo credentials: rejected because simultaneous visitors would collide and one tester could permanently break the account.
2. Blank ephemeral guest sessions: safe but incomplete because Bryen cannot immediately verify Trip Details/Players/Scores and reset behavior.
3. Seeded isolated ephemeral sessions: chosen because it preserves the existing security model while providing deterministic, resettable test data.
