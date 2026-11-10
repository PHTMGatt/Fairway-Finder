// Safe API fuzzing for CI. Loopback targets only. Sends malformed or hostile-looking inputs and fails on
// any 5xx, any stack trace or internal path in a response, or a hung request. It never targets production,
// never brute-forces, and sends a few dozen requests per path.
const target = process.env.TARGET_URL || '';
const url = new URL(target);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  console.error(`refusing non-local target ${target}`);
  process.exit(2);
}
const getPaths = (process.env.FUZZ_GET_PATHS || '').split(/\s+/).filter(Boolean);
const postPaths = (process.env.FUZZ_POST_PATHS || '').split(/\s+/).filter(Boolean);

const PAYLOADS = [
  'A'.repeat(5000), '../../../../etc/passwd', '..\\..\\..\\windows\\win.ini', '%00', '%', '%zz',
  '"><script>alert(1)</script>', "' OR '1'='1", '{"$ne":null}', '${7*7}', '{{7*7}}', '‮', '😀'.repeat(60),
  '-1', '99999999999999999999', '[]', 'null', 'undefined', '\n\r', '*', '.', '/', '$where',
];
const BODIES = ['', '{not json', '[]', 'null', '"string"', '{"__proto__":{"x":1}}', '{"a":'.repeat(500), JSON.stringify({ big: 'x'.repeat(50_000) }), '{"username":{"$ne":null},"password":{"$ne":null}}', '{"query":"{ __typename }"}', '{"query":"{ a { a { a { a } } } }"}'];

const LEAK = /\bat\s+[\w.<>$ ]+\s\(.*:\d+:\d+\)|node_modules|\/home\/runner|[A-Z]:\\\\?Users|Traceback \(most recent|SyntaxError: Unexpected|MongoServerError|ECONNREFUSED|stack"?:/;
const failures = [];
let sent = 0;

async function probe(method, path, init = {}) {
  sent++;
  try {
    const res = await fetch(new URL(path, url), { method, redirect: 'manual', signal: AbortSignal.timeout(10_000), ...init });
    const text = (await res.text()).slice(0, 20_000);
    if (res.status >= 500) failures.push(`${method} ${path.slice(0, 80)} -> ${res.status}`);
    else if (LEAK.test(text)) failures.push(`${method} ${path.slice(0, 80)} -> ${res.status} leaks internals: ${text.match(LEAK)[0].slice(0, 60)}`);
  } catch (e) {
    failures.push(`${method} ${path.slice(0, 80)} -> ${e.name}: ${e.message}`);
  }
}

for (const p of getPaths) {
  for (const payload of PAYLOADS) {
    const enc = encodeURIComponent(payload);
    const path = p.includes('{}') ? p.replace('{}', enc) : `${p}${p.includes('?') ? '&' : '?'}fuzz=${enc}`;
    await probe('GET', path);
  }
}
for (const p of postPaths) {
  for (const body of BODIES) {
    await probe('POST', p, { headers: { 'content-type': 'application/json' }, body });
  }
  await probe('POST', p, { headers: { 'content-type': 'text/plain' }, body: 'x' });
}

console.log(`fuzzing: ${sent} requests, ${failures.length} problem(s)`);
for (const f of failures.slice(0, 40)) console.log(`::error::${f}`);
process.exit(failures.length ? 1 : 0);
