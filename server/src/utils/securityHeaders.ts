// server/src/utils/securityHeaders.ts
// Baseline browser security headers without an extra dependency.
// The CSP only locks down framing, plugins, <base> and form targets: script/style
// sources are left open because Google Maps injects scripts and inline styles.

import type { Request, Response, NextFunction } from 'express';

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export const securityHeaders =
  (production: boolean) => (_req: Request, res: Response, next: NextFunction) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    next();
  };
