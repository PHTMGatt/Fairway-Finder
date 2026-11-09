# Fairway Finder: 27-point security report

- **Date:** 2026-11-09, branch `claude-forge` (fast-forwarded to `origin/main` 104ef25; it had no commits of its own)
- **Scope:** code in this repo only. Render and Atlas settings were not inspected (UNVERIFIED where they matter).

## CI and security coverage (status note)

| Before this change | After |
|---|---|
| [main.yml](.github/workflows/main.yml) ran on every push and PR: lint, build, server tests, client tests. | Unchanged, not duplicated. |
| No secret scan, no dependency audit, no config checks. | New [security-pipeline.yml](.github/workflows/security-pipeline.yml): gitleaks (pinned, checksum-verified, allowlist in [.gitleaks.toml](.gitleaks.toml), proof step with run-time fake tokens), `npm audit --audit-level=high` for `.`, `client`, `server`, and [config validation](.github/scripts/check-config.mjs). |
| No deploy step in any workflow; no `render.yaml`. | Same. Pushing to `claude-forge` cannot deploy from CI. Render auto-deploy is a dashboard setting, not inspected. |

Local results on this branch: lint 0 errors, server build ok, server tests 85/85, client tests 65/65.

## Fixed here (small, safe, tested)

- **Critical/high advisories:** `npm audit fix` (in-range only; lockfiles only) on all three packages.
- **Two unused root dependencies removed:** `pacman` (5 critical, many high) and `tree` (critical `underscore`). Neither is imported anywhere under `client/src` or `server/src` (grep), and lint, build and all tests still pass.
- **Types:** mongoose 8.13 to 8.24 (from the audit fix) made `_id as string` a compile error in `server/src/schemas/resolvers.ts` (5 lines). Changed to `as unknown as string`. Type-only, so runtime behavior is the same.

## Open dependency findings (not small or safe: major upgrades)

| Where | Advisory | Needs |
|---|---|---|
| server (production) | `@apollo/server` high | 4 to 5 major |
| server (production) | `nodemailer` high | 6 to 10 major |
| server (production) | `tar` critical via `bcrypt` 5 / `@mapbox/node-pre-gyp` | bcrypt major, or overrides |
| client (dev only) | `vite` high, `vitest` critical | vite 8 / vitest 5 majors |
| root (dev only) | `brace-expansion` high via eslint's minimatch | eslint toolchain upgrade |

CI is strict for client and root production dependencies and warns for the dev-only findings. The server audit step is report-only until the majors land, so it warns instead of failing. **Make it strict once those are upgraded.**

## Checklist

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Authentication | PASS | JWT via the Authorization header only, with exp and iat: `server/src/utils/auth.ts:51,76`. Tests: `server/test/auth-token.test.mjs`, `login.test.mjs`. |
| 2 | API keys server-side | PASS | Places, Golf and mail keys are read from env in server code: `routes/courseRoutes.ts:9`, `golfRoutes.ts:13`, `utils/mailer.ts:20`. |
| 3 | Database lockdown | UNVERIFIED | Atlas settings. `test/db-safety.test.mjs` covers seeding and remote-target guards (`seeds/seed.ts:11-16`). |
| 4 | HTTPS/TLS | PASS (partial) | `trust proxy` for Render (`server.ts:72`) and HSTS in production via `securityHeaders(NODE_ENV === 'production')`. Redirect is a Render setting, UNVERIFIED. |
| 5 | Password hashing | PASS | bcrypt in the model hook: `models/Profile.ts:97`; a timing-equalizing dummy hash on unknown users: `schemas/resolvers.ts:70,204`. |
| 6 | Server-side validation | PASS (partial) | Body capped at 100 KB (`server.ts:78`); signup/invite/code flows have tests (`invite-signup.test.mjs`, `email-codes.test.mjs`). No shared schema library. |
| 7 | XSS prevention | UNVERIFIED | React client; `dangerouslySetInnerHTML` was not audited. |
| 8 | Audit logging without secrets | UNVERIFIED | Console logging only; not reviewed for redaction. |
| 9 | Admin authorization | UNVERIFIED | Invite creation is a CLI script (`scripts/createInvite.ts`), not an HTTP route. No admin routes seen. |
| 10 | Injection | PASS (partial) | Mongoose models and typed GraphQL inputs. Not exhaustively reviewed. |
| 11 | Env/config security | PASS | `.env` gitignored, enforced by the new config gate; `runtimeEnvironment.ts:6` requires `MONGODB_URI` and `JWT_SECRET_KEY` (test: `runtime-environment.test.mjs`). `utils/emailCodes.ts:12` now throws if `JWT_SECRET_KEY` is unset (was a fixed-string fallback; test: `email-codes.test.mjs`). |
| 12 | Rate limiting | PASS | Login, signup, guest and code limiters (`schemas/resolvers.ts:12`) and API-wide limiters (`server.ts:93-95`). Test: `rate-limit.test.mjs`. |
| 13 | CORS | PASS | Origin from `CLIENT_ORIGIN`, `false` in production when unset, never `*` (`server.ts:74,77`). |
| 14 | Security headers / CSP | PASS (partial) | `securityHeaders(...)` (`server.ts:76`); test `security.test.mjs`. Contents of the CSP were not re-reviewed here. |
| 15 | Session cookies | N/A | Bearer token auth. `credentials: true` in CORS is harmless without an allowed wildcard origin. |
| 16 | CSRF | PASS | Header token, no cookie auth. |
| 17 | Password reset | UNVERIFIED | Email codes exist (15 min TTL, 5 attempts, 60 s resend: `utils/emailCodes.ts:8-10`, tested). The reset flow itself was not traced. |
| 18 | File uploads | N/A | No upload route found. |
| 19 | Price verification | N/A | No commerce. |
| 20 | Debug off in production | PASS | `x-powered-by` disabled; the client-IP debug route is opt-in via `DEBUG_CLIENT_IP` (`server.ts:83`). Apollo disables introspection in production by default. |
| 21 | Vulnerable dependencies | **FAIL (partial), improved** | See the open findings above. Production high/critical remain in the server (apollo, nodemailer, tar). |
| 22 | Unused packages | PASS (partial) | Two unused root dependencies found and removed. Not a full audit. |
| 23 | Exposed files / source maps | UNVERIFIED | Static serving was not traced. |
| 24 | Git history secret scan | UNVERIFIED | Working tree only. |
| 25 | Revoke/rotate plan | N/A | No leaked secret found. |
| 26 | Full review (IDOR) | UNVERIFIED | Trip and profile resolvers were not reviewed for ownership checks. |
| 27 | Rerun tests, report | PASS | Lint, build, 85 server and 65 client tests pass locally. |

## Outcome

Not a clean GO for production dependencies: server production advisories (apollo, nodemailer, tar) need tested major upgrades. No code-level critical issue was found in the areas reviewed. Highest-value next steps: upgrade `@apollo/server`, `nodemailer` and `bcrypt` on one branch with the existing 85 server tests, then make the server audit step strict.

## Pipeline levels (one reusable workflow)

[security-pipeline.yml](.github/workflows/security-pipeline.yml) takes a `level` input; three thin callers choose it.

| Level | Caller | Runs on | Adds |
|---|---|---|---|
| LOW | `security-low.yml` | every PR and every claude-forge push | gitleaks (tree + scanner proof), `npm audit` high/critical, config checks, build and tests where the repo's own CI does not already run them |
| MED | `security-med.yml` | nightly and manual | full-history gitleaks, dependency review, red-team tests where the repo has them |
| HIGH | `security-high.yml` | manual / pre-launch | ZAP baseline (and API fuzzing where there is an API) against a local instance with fake data, never production; then a GO / NO-GO verdict. No exemptions at this level: any high or critical advisory, failed check or open FAIL in this report is NO-GO |

Until these files are on the default branch, the med and high callers also run when `claude-forge` changes them, because schedule and manual triggers need the default branch.
