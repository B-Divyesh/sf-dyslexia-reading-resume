import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('landing page communicates and operates the core flow', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle(/Reading Resume/);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toHaveAttribute('download', '');
  await expect(page.getByText('Your difficult passages are not our data.')).toBeVisible();
  await page.getByRole('button', { name: 'Read aloud example sentence' }).click();
  await expect(page.getByRole('button', { name: 'Read aloud example sentence' })).toContainText('Pause');
  expect(errors).toEqual([]);
});

test('serves an installable packaged extension download', async ({ page }) => {
  const response = await page.request.get('/downloads/reading-resume-chrome.zip');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/zip/);
  expect((await response.body()).subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
});

test('build output has a release-versioned service-worker cache', async ({ page }) => {
  const worker = await page.request.get('/sw.js');
  const source = await worker.text();
  expect(source).toMatch(/const CACHE = 'reading-resume-[a-f0-9]{12}';/);
  expect(source).not.toContain('__BUILD_VERSION__');
});

test('keeps the application shell available offline after service-worker activation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page).toHaveTitle(/Reading Resume/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  } finally {
    await context.setOffline(false);
  }
});

test('keyboard users can use the visible skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

for (const path of ['/', '/privacy/', '/terms/']) {
  test(`has no serious accessibility findings on ${path}`, async ({ page }) => {
    await page.goto(path);
    // @axe-core/playwright's broad peer range can resolve newer Page types than the factory-pinned browser.
    const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(blocking).toEqual([]);
  });
}

test('mobile layout does not overflow and keeps primary action reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390');
  await page.goto('/');
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: innerWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toBeVisible();
});
