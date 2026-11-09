// server/src/utils/emailCodes.ts
// Issue and check 6-digit email codes for sign-up verification and password reset.
// - 15-minute lifetime, 5 wrong tries, 60 s between resends per address
// - only an HMAC (keyed by the JWT secret) is stored, compared in constant time
import crypto from 'crypto';
import EmailCode, { EmailCodePurpose } from '../models/EmailCode.js';

export const CODE_TTL_MS = 15 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;

const secret = () => process.env.JWT_SECRET_KEY || 'fairway-email-codes';

const hashCode = (email: string, purpose: EmailCodePurpose, code: string) =>
  crypto.createHmac('sha256', secret()).update(`${purpose}:${email}:${code}`).digest('hex');

export const newCode = (): string => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

export type IssueResult = { code: string } | { cooldownSeconds: number };

/** Create (or replace) the pending code for this address. Respects the resend cooldown. */
export const issueCode = async (email: string, purpose: EmailCodePurpose, now = Date.now()): Promise<IssueResult> => {
  const existing = await EmailCode.findOne({ email, purpose });
  if (existing && now - existing.sentAt.getTime() < RESEND_COOLDOWN_MS) {
    return { cooldownSeconds: Math.ceil((RESEND_COOLDOWN_MS - (now - existing.sentAt.getTime())) / 1000) };
  }
  const code = newCode();
  await EmailCode.findOneAndUpdate(
    { email, purpose },
    {
      email,
      purpose,
      codeHash: hashCode(email, purpose, code),
      attempts: 0,
      sentAt: new Date(now),
      expiresAt: new Date(now + CODE_TTL_MS),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { code };
};

export type CheckResult = 'ok' | 'invalid' | 'expired' | 'locked';

/** Check a code; a correct code is consumed, a wrong one uses up an attempt. */
export const checkCode = async (email: string, purpose: EmailCodePurpose, code: string, now = Date.now()): Promise<CheckResult> => {
  if (!/^\d{6}$/.test(code.trim())) return 'invalid';
  const record = await EmailCode.findOneAndUpdate(
    { email, purpose, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!record) {
    const exists = await EmailCode.exists({ email, purpose });
    return exists ? 'locked' : 'expired';
  }
  if (record.expiresAt.getTime() <= now) {
    await record.deleteOne();
    return 'expired';
  }
  const expected = Buffer.from(record.codeHash, 'hex');
  const actual = Buffer.from(hashCode(email, purpose, code.trim()), 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return record.attempts >= MAX_ATTEMPTS ? 'locked' : 'invalid';
  }
  await record.deleteOne();
  return 'ok';
};

export const codeErrorMessage = (result: Exclude<CheckResult, 'ok'>): string =>
  result === 'locked'
    ? 'Too many wrong codes. Ask for a new one.'
    : result === 'expired'
      ? 'That code expired. Ask for a new one.'
      : "That code isn't right. Check the email and try again.";
