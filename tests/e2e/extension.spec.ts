import { chromium, expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('packaged extension saves and restores the same sentence after reload', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#privacy-first').scrollIntoViewIfNeeded();

    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });

    const saved = await send('SAVE_PLACE') as { hasAnchor: boolean; sentence?: string; error?: string };
    expect(saved.error).toBeUndefined();
    expect(saved.hasAnchor).toBe(true);
    expect(saved.sentence?.length).toBeGreaterThan(5);

    await page.reload();
    await page.waitForLoadState('networkidle');
    const restored = await send('RESUME_PLACE') as { hasAnchor: boolean; sentence?: string; stripOpen: boolean; error?: string };
    expect(restored.error).toBeUndefined();
    expect(restored.sentence).toBe(saved.sentence);
    expect(restored.stripOpen).toBe(true);

    const extensionId = new URL(worker.url()).host;
    for (const view of ['popup.html', 'options.html']) {
      const extensionPage = await context.newPage();
      await extensionPage.goto(`chrome-extension://${extensionId}/${view}`);
      if (view === 'options.html') {
        await extensionPage.locator('#license').fill('');
        await extensionPage.getByRole('button', { name: 'Verify' }).click();
        await expect(extensionPage.locator('#license-status')).toHaveText('Enter the license token from your receipt.');
      }
      const results = await new AxeBuilder({ page: extensionPage as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
      await extensionPage.close();
    }
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('packaged extension saves the specifically selected sentence in a shared text node', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-selection-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.setContent('<main><p>First sentence is intentionally ordinary. Second sentence is the selected sentence to save. Third sentence closes the test.</p></main>');
    await page.evaluate(() => {
      const text = document.querySelector('p')!.firstChild!;
      const start = text.textContent!.indexOf('Second sentence');
      const range = document.createRange();
      range.setStart(text, start);
      range.setEnd(text, start + 'Second sentence is the selected sentence to save.'.length);
      const selection = document.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });

    const saved = await worker.evaluate(async ({ targetUrl }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type: 'SAVE_PLACE' });
    }, { targetUrl: page.url() }) as { sentence?: string; error?: string };

    expect(saved.error).toBeUndefined();
    expect(saved.sentence).toBe('Second sentence is the selected sentence to save.');
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
