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
export default Invite;
