// CI config gate (no dependencies). Usage: node .github/scripts/check-config.mjs <packageDir>...
// Fails on: unparsable package.json, missing lockfile, tracked secret files, .env not gitignored,
// secrets inside committed config (render.yaml, .env.example, *.config.json).
// Warns if render.yaml enables autoDeploy.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const errors = [];
const warns = [];
const dirs = process.argv.slice(2);
if (!dirs.length) dirs.push('.');

for (const d of dirs) {
  const pj = path.join(d, 'package.json');
  try {
    JSON.parse(readFileSync(pj, 'utf8'));
  } catch (e) {
    errors.push(pj + ': ' + e.message);
    continue;
  }
  if (!existsSync(path.join(d, 'package-lock.json'))) errors.push(d + ': package-lock.json is missing (npm ci and npm audit need it)');
}

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const SECRET_FILE = /(^|\/)(\.env(\.(?!example|sample|template).*)?|\.npmrc|id_(rsa|ed25519|ecdsa)|[^/]*\.(pem|key|p12|pfx|keystore|jks))$/i;
for (const f of tracked) if (SECRET_FILE.test(f)) errors.push('tracked secret-looking file: ' + f);

try {
  const gi = readFileSync('.gitignore', 'utf8');
  if (!/^\/?\.env\b/m.test(gi)) errors.push('.gitignore does not ignore .env');
  if (!/^\/?(\*\*\/)?node_modules\/?$/m.test(gi)) warns.push('.gitignore does not ignore node_modules');
} catch {
  errors.push('.gitignore is missing');
}

const PATTERNS = [
  ['MongoDB URI with credentials', /mongodb(\+srv)?:\/\/[^\s/"']+:[^\s@"']+@/i],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}/],
  ['Anthropic/OpenAI key', /\bsk-(ant-)?[A-Za-z0-9_-]{16,}/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['AWS access key', /\bAKIA[A-Z0-9]{16}\b/],
];
const CONFIGS = /(^|\/)(render\.ya?ml|\.env\.(example|sample|template)|[^/]*\.config\.json)$/i;
for (const f of tracked.filter((f) => CONFIGS.test(f))) {
  const text = readFileSync(f, 'utf8');
  for (const [label, re] of PATTERNS) if (re.test(text)) errors.push(f + ': contains a ' + label);
  if (/render\.ya?ml$/i.test(f) && /autoDeploy:\s*true/.test(text)) warns.push(f + ': autoDeploy is true');
}

for (const m of warns) console.log('::warning::' + m);
if (errors.length) {
  for (const m of errors) console.log('::error::' + m);
  process.exit(1);
}
console.log('config OK (' + dirs.join(', ') + '; ' + tracked.length + ' tracked files checked)');
