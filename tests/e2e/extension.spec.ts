import { chromium, expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('@claim:resume-after-reload packaged extension restores the same demo sentence after reload', async ({}, testInfo) => {
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
    await page.goto('http://127.0.0.1:4173/demo/');
    await page.locator('.sample-article').scrollIntoViewIfNeeded();

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

test('@claim:exact-sentence packaged extension saves the specifically selected demo sentence', async ({}, testInfo) => {
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
    await page.goto('http://127.0.0.1:4173/demo/');
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

test('@claim:duplicate-sentence packaged extension resumes the selected occurrence of an exact duplicate sentence', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-duplicate-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/demo/');
    await page.setContent(`<main>
      <p>Opening context.</p>
      <p>Duplicate marker sentence.</p>
      <p>Middle context.</p>
      <p>Duplicate marker sentence.</p>
      <p>Closing context.</p>
    </main>`);
    await page.locator('p').nth(3).selectText();

    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });
    const highlightedParagraph = () => page.evaluate(() => {
      const highlight = CSS.highlights.get('reading-resume-current');
      const range = highlight ? [...highlight][0] as Range : undefined;
      return range ? [...document.querySelectorAll('p')].indexOf(range.startContainer.parentElement as HTMLParagraphElement) : -1;
    });

    const saved = await send('SAVE_PLACE') as { sentence?: string; error?: string };
    expect(saved.error).toBeUndefined();
    expect(saved.sentence).toBe('Duplicate marker sentence.');
    expect(await highlightedParagraph()).toBe(3);

    const restored = await send('RESUME_PLACE') as { sentence?: string; error?: string };
    expect(restored.error).toBeUndefined();
    expect(restored.sentence).toBe('Duplicate marker sentence.');
    expect(await highlightedParagraph()).toBe(3);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:changed-page-recovery the packaged extension asks for a new save when the demo article changes', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-changed-demo-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/demo/');
    await page.locator('.sample-article > p').nth(3).selectText();
    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Demo tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });
    await send('SAVE_PLACE');
    await page.evaluate(() => {
      document.querySelector('.sample-article')!.innerHTML = '<h2>Revised station notes</h2><p>Every sentence in this revised article is unrelated to the saved sample.</p>';
    });
    const result = await send('RESUME_PLACE') as { error?: string };
    expect(result.error).toBe('The page changed and the saved sentence could not be matched. Save a new place.');
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:reading-strip the packaged extension moves through demo sentences in its reading strip', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-strip-demo-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/demo/');
    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Demo tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });
    await page.locator('.sample-article > p').nth(3).selectText();
    await send('SAVE_PLACE');
    const highlightedText = () => page.evaluate(() => {
      const highlight = CSS.highlights.get('reading-resume-current');
      const range = highlight ? [...highlight][0] as Range : undefined;
      return range?.toString() || '';
    });
    const opened = await send('OPEN_STRIP') as { stripOpen: boolean };
    expect(opened.stripOpen).toBe(true);
    const initialText = await highlightedText();
    const moved = await send('NEXT_SENTENCE') as { stripOpen: boolean };
    expect(moved.stripOpen).toBe(true);
    expect(initialText.length).toBeGreaterThan(5);
    expect(await highlightedText()).not.toBe(initialText);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:local-anchor-storage the packaged demo stores its anchor under the isolated local namespace', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-local-demo-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/demo/');
    await page.locator('.sample-article > p').nth(3).selectText();
    const result = await worker.evaluate(async ({ targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Demo tab not found');
      await chrome.tabs.sendMessage(tab.id, { type: 'SAVE_PLACE' });
      return chrome.storage.local.get(null);
    }, { targetUrl: page.url() }) as Record<string, unknown>;
    expect(Object.keys(result).filter((key) => key.startsWith('demo:anchor:'))).toHaveLength(1);
    expect(Object.keys(result).some((key) => key.startsWith('anchor:'))).toBe(false);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await expect.poll(async () => worker!.evaluate(async () => Object.keys(await chrome.storage.local.get(null))
      .filter((key) => key.startsWith('demo:anchor:')))).toEqual([]);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:export-clear the packaged demo exports and clears only its demo anchor', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-export-demo-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/demo/');
    await page.locator('.sample-article > p').nth(3).selectText();
    await worker.evaluate(async ({ targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Demo tab not found');
      await chrome.tabs.sendMessage(tab.id, { type: 'SAVE_PLACE' });
    }, { targetUrl: page.url() });
    const extensionId = new URL(worker.url()).host;
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html?demo=1`);
    const downloadPromise = options.waitForEvent('download');
    await options.getByRole('button', { name: 'Export saved places' }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).not.toBeNull();
    expect(await readFile(path!, 'utf8')).toContain('At 2:15, Mira stopped at the sentence about the train platform.');
    options.once('dialog', (dialog) => dialog.accept());
    await options.getByRole('button', { name: 'Clear saved places' }).click();
    await expect(options.locator('#data-status')).toHaveText('All saved places were cleared.');
    const stored = await worker.evaluate(() => chrome.storage.local.get(null)) as Record<string, unknown>;
    expect(Object.keys(stored).filter((key) => key.startsWith('demo:anchor:'))).toHaveLength(0);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
