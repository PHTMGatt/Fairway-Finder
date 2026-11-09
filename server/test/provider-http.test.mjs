import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { dist } from './helpers.mjs';

const { fetchWithTimeout } = await dist('services/http.js');

let server;
let baseUrl;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/slow') {
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }, 250);
      return;
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

test('fetchWithTimeout returns normal responses before the deadline', async () => {
  const response = await fetchWithTimeout(`${baseUrl}/fast`, {}, 500);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('fetchWithTimeout aborts a slow provider request', async () => {
  await assert.rejects(
    () => fetchWithTimeout(`${baseUrl}/slow`, {}, 40),
    (error) => error?.name === 'AbortError'
  );
});
