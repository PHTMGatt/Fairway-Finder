// server/src/models/Invite.ts

import { Schema, model, Document, Types } from 'mongoose';
import { randomBytes, createHash } from 'crypto';

/**
 * Note; A single-use invitation to create a permanent account.
 * Only a SHA-256 hash of the code is stored, so a database leak doesn't leak usable invites.
 */
export interface InviteDoc extends Document {
  codeHash: string;
  email?: string | null;          // Note; when set, only this email may redeem the invite
  expiresAt: Date;
  usedAt?: Date | null;
  usedBy?: Types.ObjectId | null; // Note; Profile that redeemed it
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<InviteDoc>(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [/.+@.+\..+/, 'Must match a valid email address'],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

/**
 * Note; Generate a new random invite code (128 bits, URL-safe so it can go in an ?invite= link).
 */
export const generateInviteCode = (): string => randomBytes(16).toString('base64url');

/**
 * Note; Hash an invite code for storage/lookup. Codes are high-entropy, so a fast hash is enough.
 */
export const hashInviteCode = (code: string): string =>
  createHash('sha256').update(code.trim()).digest('hex');

const Invite = model<InviteDoc>('Invite', inviteSchema);

// Note; Matches an invite this email may redeem right now: right code, unused, unexpired, email lock ok
const usableInviteFilter = (code: string, email: string, now: Date) => ({
  codeHash: hashInviteCode(code),
  usedAt: null,
  expiresAt: { $gt: now },
  $or: [{ email: null }, { email }],
});

/**
 * Note; Read-only check that an invite is currently usable by this email, without claiming it.
 */
export const isInviteUsable = async (code: string, email: string) =>
  (await Invite.exists(usableInviteFilter(code, email, new Date()))) !== null;

/**
 * Note; Atomically claim an unused, unexpired invite for this email.
 * Returns null if the code is wrong, used, expired, or locked to another email,
 * so two simultaneous sign-ups can never both redeem the same invite.
 */
export const claimInvite = (code: string, email: string) => {
  const now = new Date();
  return Invite.findOneAndUpdate(
    usableInviteFilter(code, email, now),
    { $set: { usedAt: now } },
    { new: true }
  );
};

/**
 * Note; Record which profile redeemed a claimed invite.
 */
export const markInviteUsedBy = (inviteId: Types.ObjectId, profileId: Types.ObjectId) =>
  Invite.updateOne({ _id: inviteId }, { $set: { usedBy: profileId } });

/**
 * Note; Give a claimed invite back if account creation failed afterwards.
 */
export const releaseInvite = (inviteId: Types.ObjectId) =>
  Invite.updateOne({ _id: inviteId, usedBy: null }, { $set: { usedAt: null } });

export default Invite;
