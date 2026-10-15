import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4176';
const browser = await chromium.launch({ headless: true });
const reports = [];
await fs.mkdir('artifacts/screenshots', { recursive: true });
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.fulfill({
      status: route.request().url().includes('/locations/suggest') ? 200 : 503,
      contentType: 'application/json',
      body: route.request().url().includes('/locations/suggest') ? '[{"label":"Ann Arbor, MI","value":"Ann Arbor, MI"}]' : '{"error":"Unavailable in local test"}',
    }));
    await page.route('**/graphql', route => route.fulfill({ contentType: 'application/json', body: '{"errors":[{"message":"Not authenticated"}]}' }));
    for (const path of ['/', '/login', '/signup', '/courses', '/routing', '/weather', '/handicap', '/plan-trip', '/saved-trips', '/me', '/trip/507f1f77bcf86cd799439011', '/missing']) {
      await page.goto(base + path);
      await page.locator('h1, h2').first().waitFor();
      await page.waitForTimeout(250);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow ${width} ${path}`);
      assert((await page.locator('body').innerText()).length > 80, 'not a blank page');
      if (path === '/routing') await page.getByText(/interactive map is not configured/).waitFor();
      assert.equal(await page.getByRole('button', { name: /Delete All Users/ }).count(), 0);
      await page.screenshot({ path: `artifacts/screenshots/${width}-${path.replace(/\W/g, '-')}.png` });
      reports.push({ width, path, passed: true });
    }
    await page.goto(base + '/routing');
    const input = page.getByRole('combobox', { name: 'Route start location' });
    await input.fill('Ann');
    await page.getByRole('option', { name: /Ann Arbor/ }).waitFor();
    await input.press('ArrowDown');
    assert(await input.getAttribute('aria-activedescendant'));
    await input.press('Enter');
    assert.equal(await input.inputValue(), 'Ann Arbor, MI');
    await input.fill('Det');
    await page.getByRole('option').waitFor();
    await input.press('Escape');
    assert.equal(await input.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(errors, []);
    reports.push({ width, interactions: 'keyboard location selection and dismissal, missing Maps configuration', passed: true });
    await context.close();
  }
} finally { await browser.close(); }
await fs.writeFile('artifacts/browser-smoke.json', JSON.stringify(reports, null, 2));
console.log(`${reports.length} Fairway Finder checks passed. API/GraphQL mocked; no live database writes.`);
