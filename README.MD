# Fairway Finder

Fairway Finder is a full-stack golf trip planner built with React, TypeScript, Apollo GraphQL, Express, MongoDB/Mongoose, Google Maps, and external golf/weather data.

The project is being shaped for **private, small-group use**: permanent accounts are invite-only, while a temporary **Guest Demo** provides a low-friction way to try the trip-planning workflow without creating a permanent account.

## Core experience

- Plan golf trips and save courses to a trip
- View saved trips and trip details
- Track players, handicaps, and hole-by-hole scores
- Search courses and use map/routing tools
- View weather information for trip planning
- Private account data scoped to the authenticated owner

## Secure access model

The current secure-access feature work includes:

- **Invite-only signup** for permanent accounts
- Password login with rate limiting and timing equalization
- JWT authentication with a required strong secret
- Trip ownership checks on protected reads/writes
- **24-hour Guest Demo** sessions
- Guest trips automatically tied to the guest expiry
- Maximum of **3 guest trips**
- Guest creation rate limits and an active-guest cap
- Guest identities reserved from permanent signup/login
- MongoDB guest-only TTL cleanup plus a backup cleanup sweep
- Explicit server startup gate that waits for guest TTL and invite indexes before accepting traffic

Guest Demo client UX includes a shared **Try as Guest** action, Plan Trip landing, expiry messaging, a header expiry warning, and separate handling for normal vs guest session expiry.

> The secure-access rollout should not be treated as production-ready until the deployment checklist in `HANDOFF.md` is complete, including a production DB backup and post-deploy smoke test.

## Stack

### Client
- React 18
- TypeScript
- Vite
- React Router
- Apollo Client
- Bootstrap / custom CSS
- Google Maps via `@vis.gl/react-google-maps`

### Server
- Node.js
- Express
- Apollo Server / GraphQL
- MongoDB + Mongoose
- JWT authentication
- `express-rate-limit`

### Testing / validation
- Node test runner + `mongodb-memory-server` for server integration tests
- Vitest for client unit tests
- ESLint
- TypeScript builds for client and server
- GitHub Actions validation on pushes and pull requests

The MongoDB integration tests use an in-memory localhost database. They are intentionally isolated from production Atlas data.

## Local setup

### Prerequisites

- Node.js 20+
- npm
- A local/dev MongoDB connection string or the repository's test tooling
- Required API keys for Maps / Places / golf data
- A strong JWT secret

### Install

```bash
npm install
```

### Development

Run the server and client using the repository scripts/environment expected by each package. The server expects its environment file under `server/.env`.

Common required variables include:

```env
MONGODB_URI=...
JWT_SECRET_KEY=...
PLACES_API_KEY=...
GOLF_API_KEY=...
```

The client requires its Vite-exposed Maps key, for example:

```env
VITE_GOOGLE_MAPS_API_KEY=...
```

Never commit real secrets or production connection strings.

## Validation

From the repository root:

```bash
npm run lint
npm run build
npm test
```

Client tests can also be run directly:

```bash
cd client
npm test -- --run
```

The current verified feature checkpoint passes **50 server tests**, **15 client tests**, the full client/server build, and lint with **0 errors / 0 warnings**. See `HANDOFF.md` for the exact rollout state and remaining production gates.

## MongoDB safety

Production MongoDB is treated as persistent user data, not as a test environment.

- Guest expiry is implemented with **partial TTL indexes** that only match `{ isGuest: true }`
- Permanent profiles/trips do not receive guest expiry fields
- Startup creates declared safety-critical indexes additively and does not drop unrelated production indexes
- Seed/invite tooling contains guards against accidental remote writes
- Take a production backup before the first deployment that enables the new guest/invite index behavior

## Deployment

The app is designed to run as a single full-stack service in production, with the server serving the built client. Do not deploy the secure-access/Guest Demo work until the ordered rollout checklist in `HANDOFF.md` has been completed.

## License / portfolio note

This is a personal portfolio project and private-use application. Do not reuse private deployment credentials, API keys, database contents, or invite secrets.
