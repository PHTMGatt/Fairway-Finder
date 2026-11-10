// server/src/utils/mailer.ts
// Sends verification / password-reset codes through Gmail SMTP using an
// app password (GMAIL_USER + GMAIL_APP_PASSWORD). When those are not set,
// email codes are disabled and sign-up falls back to invite codes.
// Tests swap in a capture function with setTestMailer().

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface CodeEmail {
  to: string;
  subject: string;
  text: string;
}

type SendFn = (message: CodeEmail) => Promise<void>;

let testSender: SendFn | null = null;
let transport: Transporter | null = null;

const gmailUser = () => process.env.GMAIL_USER?.trim() || '';
const gmailPassword = () => (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

export const emailCodesEnabled = (): boolean => Boolean(testSender || (gmailUser() && gmailPassword()));

/** Test hook: capture outgoing mail instead of sending it (pass null to restore). */
export const setTestMailer = (fn: SendFn | null) => {
  testSender = fn;
};

export const sendMail = async (message: CodeEmail): Promise<void> => {
  if (testSender) return testSender(message);
  if (!gmailUser() || !gmailPassword()) throw new Error('Email is not configured');
  transport ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser(), pass: gmailPassword() },
  });
  await transport.sendMail({
    from: `Fairway Finder <${gmailUser()}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
};

export const codeEmail = (to: string, purpose: 'signup' | 'reset', code: string): CodeEmail => ({
  to,
  subject: purpose === 'signup' ? `Your Fairway Finder code: ${code}` : `Reset your Fairway Finder password: ${code}`,
  text:
    purpose === 'signup'
      ? `Welcome to Fairway Finder!\n\nYour code is ${code}\n\nType it into the app to finish creating your account. It expires in 15 minutes.\n\nIf you didn't sign up, ignore this email.`
      : `Someone asked to reset your Fairway Finder password.\n\nYour code is ${code}\n\nIt expires in 15 minutes. If this wasn't you, ignore this email; your password hasn't changed.`,
});
