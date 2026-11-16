# Smoke checklist: login and email codes (after #79, bcrypt 6, Node 18+)

#79 is merged to main (2026-11-16 05:33 UTC). `engines.node >=18` is set in the root and server package.json. Run this after Render deploys main.

Env vars that must exist on Render (names only): `JWT_SECRET_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, plus the Mongo URI. Check Render runs Node 18 or newer (Render default is fine, or add `NODE_VERSION`).

Codes last 15 minutes and lock after 5 wrong tries (`server/src/utils/emailCodes.ts`).

## Checks (about 10 minutes, use a throwaway email you own)

1. Site loads, no console errors, Render logs show a clean boot.
2. Existing account login (an account made before bcrypt 6): correct password logs in. This proves old hashes still verify.
3. Wrong password gives a plain error, no crash, no stack trace.
4. Sign up with a new email: the code mail arrives (check spam). Wrong code is rejected. Correct code logs you in.
5. Request a code twice: the newer code works.
6. Enter 5 wrong codes: the account is locked out of that code. A fresh request unlocks.
7. Forgot password: code arrives, reset works, old password fails, new one works.
8. Logout, reload: still logged out. Login again: token works (open a saved page).

PASS means all 8. Any FAIL: Render dashboard, Events, Rollback, and tell Gandalf which step.
