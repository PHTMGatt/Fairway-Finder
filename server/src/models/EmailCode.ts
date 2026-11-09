// server/src/models/EmailCode.ts
// One pending 6-digit code per (email, purpose). Only an HMAC of the code is
// stored; MongoDB's TTL index removes it once expiresAt passes.
import { Schema, model, Document } from 'mongoose';

export type EmailCodePurpose = 'signup' | 'reset';

export interface EmailCodeDoc extends Document {
  email: string;
  purpose: EmailCodePurpose;
  codeHash: string;
  attempts: number;
  sentAt: Date;
  expiresAt: Date;
}

const emailCodeSchema = new Schema<EmailCodeDoc>({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, required: true, enum: ['signup', 'reset'] },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

emailCodeSchema.index({ email: 1, purpose: 1 }, { unique: true });
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailCode = model<EmailCodeDoc>('EmailCode', emailCodeSchema);

export default EmailCode;
