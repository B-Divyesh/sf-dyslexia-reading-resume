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
