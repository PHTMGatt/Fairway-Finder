// server/test/db-safety.test.mjs — guards that keep scripts away from non-local databases (no database)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import path from 'path';
import { SERVER_DIR, dist } from './helpers.mjs';

const { describeMongoTarget } = await dist('utils/dbTarget.js');

// Note; .invalid hosts can never resolve, so nothing here can reach a real server
const ATLAS_LIKE = 'mongodb+srv://user:secret@cluster0.fake.invalid/Fairway-Finder';

test('describeMongoTarget reports host and database without credentials', () => {
  const target = describeMongoTarget(ATLAS_LIKE);
  assert.deepEqual(target, { host: 'cluster0.fake.invalid', database: 'Fairway-Finder', isLocal: false });
  assert.ok(!JSON.stringify(target).includes('secret'));
});

test('describeMongoTarget: only localhost / 127.0.0.1 / [::1] count as local', () => {
  for (const uri of ['mongodb://localhost:27017/a', 'mongodb://127.0.0.1/a', 'mongodb://[::1]:27017/a']) {
    assert.equal(describeMongoTarget(uri).isLocal, true, uri);
  }
  for (const uri of ['mongodb://db.example.com/a', '', undefined, 'not a uri', 'mongodb://h1,h2/a']) {
    assert.equal(describeMongoTarget(uri).isLocal, false, String(uri));
  }
});

const invite = (args, env) =>
  spawnSync(process.execPath, [path.join(SERVER_DIR, 'dist/scripts/createInvite.js'), ...args], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 30_000,
  });

test('invite CLI refuses to write to a remote database without --allow-remote', () => {
  const res = invite([], { MONGODB_URI: ATLAS_LIKE });
  assert.equal(res.status, 1);
  assert.match(res.stdout, /host=cluster0\.fake\.invalid db=Fairway-Finder \(REMOTE\)/);
  assert.match(res.stderr, /Refusing to write to non-local host/);
});

test('invite CLI --dry-run never connects', () => {
  const res = invite(['--dry-run', '--email', 'pat@example.com', '--base-url', 'https://example.test'], { MONGODB_URI: ATLAS_LIKE });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Dry run: nothing was written/);
  assert.doesNotMatch(res.stdout, /Connecting/);
});

test('invite CLI rejects bad arguments before connecting', () => {
  for (const args of [['--days', '0'], ['--days', '1.5'], ['--email', 'nope'], ['--base-url', 'not a url'], ['--force']]) {
    const res = invite(args, { MONGODB_URI: 'mongodb://127.0.0.1:1/never' });
    assert.equal(res.status, 1, args.join(' '));
    assert.doesNotMatch(res.stdout, /Connecting/, args.join(' '));
  }
});
