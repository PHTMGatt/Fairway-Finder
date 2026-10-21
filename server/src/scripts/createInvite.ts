// server/src/scripts/createInvite.ts
//
// Create a single-use invite for a permanent account.
//
//   npm run invite -- [--email person@example.com] [--days 7] [--note "text"]
//                     [--base-url https://your-app] [--dry-run] [--allow-remote]
//
// The plain code is printed once and never stored; only its SHA-256 hash is saved.
// Writes are refused for any non-local database unless --allow-remote is passed.

import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import dotenv from 'dotenv';
import { describeMongoTarget } from '../utils/dbTarget.js';
import { generateInviteCode, hashInviteCode } from '../models/Invite.js';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env'),
});

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

const fail = (message: string): never => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

const parseCliArgs = () => {
  try {
    return parseArgs({
      options: {
        email: { type: 'string' },
        days: { type: 'string' },
        note: { type: 'string' },
        'base-url': { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        'allow-remote': { type: 'boolean', default: false },
      },
      strict: true,
    }).values;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : 'Invalid arguments');
  }
};

const args = parseCliArgs();

const days = args.days === undefined ? DEFAULT_DAYS : Number(args.days);
if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
  fail(`--days must be a whole number from 1 to ${MAX_DAYS}`);
}

const email = args.email?.trim().toLowerCase() || null;
if (email && !/.+@.+\..+/.test(email)) {
  fail('--email must be a valid email address');
}

if (args['base-url'] && !URL.canParse(args['base-url'])) {
  fail('--base-url must be a full URL, e.g. https://fairway-finder.onrender.com');
}

const target = describeMongoTarget(process.env.MONGODB_URI);
console.log(`🎯 Target database: host=${target.host} db=${target.database} (${target.isLocal ? 'local' : 'REMOTE'})`);

const code = generateInviteCode();
const invite = {
  codeHash: hashInviteCode(code),
  email,
  expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  ...(args.note ? { note: args.note } : {}),
};

const printInvite = () => {
  console.log(`🎟️  Invite code: ${code}`);
  if (args['base-url']) {
    const link = new URL('/signup', args['base-url']);
    link.searchParams.set('invite', code);
    console.log(`🔗 Signup link: ${link.toString()}`);
  }
  console.log(`   Expires: ${invite.expiresAt.toISOString()}${email ? `  ·  Locked to: ${email}` : ''}`);
};

const run = async () => {
  if (args['dry-run']) {
    console.log('🧪 Dry run: nothing was written. This code is NOT valid.');
    printInvite();
    return;
  }

  if (!process.env.MONGODB_URI) fail('MONGODB_URI is not set (server/.env)');
  if (!target.isLocal && !args['allow-remote']) {
    fail(`Refusing to write to non-local host "${target.host}". Re-run with --allow-remote if this is intended.`);
  }

  // Note; Imported only after the safety checks, because importing the connection needs MONGODB_URI
  const { connectDatabase } = await import('../config/connection.js');
  const { default: Invite } = await import('../models/Invite.js');
  const mongoose = (await import('mongoose')).default;

  await connectDatabase();
  try {
    const saved = await Invite.create(invite);
    console.log(`✅ Invite saved (id ${saved._id}). Share this code now; it cannot be shown again.`);
    printInvite();
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((err: unknown) => fail(err instanceof Error ? err.message : 'Unknown error'));
