import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dist } from './helpers.mjs';

const runtimeEnvironment = await dist('utils/runtimeEnvironment.js');
const { getMissingCoreEnvironment, getProviderCapabilities } = runtimeEnvironment;

test('only MongoDB and JWT secret are core server requirements', () => {
  assert.deepEqual(getMissingCoreEnvironment({}), ['MONGODB_URI', 'JWT_SECRET_KEY']);
  assert.deepEqual(
    getMissingCoreEnvironment({ MONGODB_URI: 'mongodb://local', JWT_SECRET_KEY: 'secret' }),
    []
  );
  assert.deepEqual(
    getMissingCoreEnvironment({
      MONGODB_URI: 'mongodb://local',
      JWT_SECRET_KEY: 'secret',
      PLACES_API_KEY: undefined,
      GOLF_API_KEY: undefined,
    }),
    []
  );
});

test('provider capability reporting treats Google and Golf keys as optional', () => {
  assert.deepEqual(getProviderCapabilities({}), { google: false, golf: false });
  assert.deepEqual(
    getProviderCapabilities({ PLACES_API_KEY: 'google', GOLF_API_KEY: 'golf' }),
    { google: true, golf: true }
  );
});

for (const route of ['courseRoutes.js', 'mapRoutes.js', 'golfRoutes.js']) {
  test(`${route} can load without paid provider keys`, () => {
    const routeUrl = new URL(`../dist/routes/${route}`, import.meta.url).href;
    const script = `delete process.env.PLACES_API_KEY; delete process.env.GOLF_API_KEY; await import(${JSON.stringify(routeUrl)});`;
    const child = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
      env: {
        ...process.env,
        PLACES_API_KEY: '',
        GOLF_API_KEY: '',
      },
      encoding: 'utf8',
    });

    assert.equal(
      child.status,
      0,
      `${route} should not terminate startup when optional keys are absent. stderr: ${child.stderr}`
    );
  });
}
