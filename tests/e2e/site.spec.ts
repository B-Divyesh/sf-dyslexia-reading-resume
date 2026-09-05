import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('landing page states the job, audience, and first action', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('Reading Resume — Save your reading place');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Save your place in a web article');
  await expect(page.getByText('For dyslexic web readers who need to resume after an interruption.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Try it with sample data/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('@claim:demo-isolation the sample is populated and uses a separate storage record', async ({ page }) => {
  await page.goto('/demo/');
  await page.evaluate(() => localStorage.setItem('reading-resume:real-anchor', 'keep this real value'));
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#demo-sentence')).toHaveText('At 2:15, Mira stopped at the sentence about the train platform.');
  await page.getByRole('button', { name: 'Save this sentence' }).click();
  const storage = await page.evaluate(() => ({ real: localStorage.getItem('reading-resume:real-anchor'), demo: localStorage.getItem('demo:reading-resume:sample') }));
  expect(storage.real).toBe('keep this real value');
  expect(storage.demo).toContain('savedIndex');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('status')).toContainText('Demo reset');
});

test('@claim:sample-controls the sample saves a chosen sentence and restores it after reload', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Sentence 5' }).click();
  await page.getByRole('button', { name: 'Save this sentence' }).click();
  await expect(page.getByRole('status')).toContainText('Sample sentence saved');
  await page.reload();
  await page.getByRole('button', { name: 'Resume saved sentence' }).click();
  await expect(page.getByRole('status')).toContainText('Returned to saved sentence 5');
  await expect(page.locator('#demo-sentence')).toHaveText('The next train arrived on time, and the repaired sign showed the correct destination.');
});

test('@claim:read-aloud the sample starts browser read aloud for the visible sentence', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    class RecordedUtterance {
      readonly text: string;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, '__readingResumeSpoken', { configurable: true, value: spoken });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: RecordedUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak(utterance: RecordedUtterance) { spoken.push(utterance.text); },
        cancel() {}
      }
    });
  });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Sentence 4' }).click();
  const visibleSentence = await page.locator('#demo-sentence').textContent();
  await page.getByRole('button', { name: /Read aloud/ }).click();
  await expect(page.getByRole('status')).toHaveText('Reading the sample with your browser voice.');
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
  const spoken = await page.evaluate(() => (window as unknown as { __readingResumeSpoken: string[] }).__readingResumeSpoken);
  expect(spoken).toEqual([visibleSentence]);
});

test('@claim:offline-demo the sample reloads offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/demo/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Demo — Reading Resume');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Return to a saved sentence');
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:no-tracking the public website sets no cookies and makes no third-party runtime requests', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  for (const path of ['/', '/privacy/', '/terms/', '/404.html', '/demo/']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  await page.getByRole('button', { name: 'Sentence 4' }).click();
  await page.getByRole('button', { name: 'Save this sentence' }).click();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
  expect(await page.context().cookies()).toEqual([]);
});

test('@claim:plus-price the sample shows the one-time $12 preset price', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByText('Optional reading-strip presets cost $12 once. No subscription.')).toBeVisible();
});

test('@claim:extension-download the sample links to an installable extension archive', async ({ page }) => {
  await page.goto('/demo/');
  const response = await page.request.get('/downloads/reading-resume-chrome.zip');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/zip/);
  expect((await response.body()).subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
});

test('@claim:license-recovery a blank restore token explains what to enter', async ({ page }) => {
  await page.goto('/demo/');
  await page.goto('/');
  await page.getByRole('button', { name: 'Have a license? Restore it' }).click();
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('#license-status')).toHaveText('Enter the license token from your receipt.');
  await expect(page.locator('#license')).toBeFocused();
});

test('@claim:route-metadata every public route has its own title and required metadata', async ({ page }) => {
  const cases = [
    ['/', 'Reading Resume — Save your reading place'],
    ['/demo/', 'Demo — Reading Resume'],
    ['/privacy/', 'Privacy — Reading Resume'],
    ['/terms/', 'Terms — Reading Resume'],
    ['/404.html', 'Page not found — Reading Resume']
  ] as const;
  for (const [path, title] of cases) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  }
});

test('@claim:not-found the not-found page explains the problem and offers a way back', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This Reading Resume page was not found');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', '/demo/');
});

test('@claim:mobile-layout the 390 px sample has no horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390');
  await page.goto('/demo/');
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(metrics.clientWidth).toBe(390);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  await expect(page.getByRole('button', { name: 'Save this sentence' })).toBeVisible();
});

test('build output has a release-versioned service-worker cache', async ({ page }) => {
  const worker = await page.request.get('/sw.js');
  const source = await worker.text();
  expect(source).toMatch(/const CACHE = 'reading-resume-[a-f0-9]{12}';/);
  expect(source).not.toContain('__BUILD_VERSION__');
});

test('keyboard users can use the visible skip link', async ({ page }) => {
  await page.goto('/demo/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
  test(`has no serious accessibility findings on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(blocking).toEqual([]);
  });
}
