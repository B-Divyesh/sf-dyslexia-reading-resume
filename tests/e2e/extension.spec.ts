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

test('@claim:article-text-private packaged extension keeps article text out of network requests', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-private-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  const requests: { url: string; body: string }[] = [];
  context.on('request', (request) => requests.push({ url: request.url(), body: request.postData() || '' }));
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/privacy/');
    await page.waitForLoadState('networkidle');
    const articleSentence = 'Juno counted seven copper lamps before saving this private sentence.';
    await page.setContent(`<html lang="en"><body><main><p>Opening sentence for the privacy check.</p><p>${articleSentence}</p><p>Closing sentence for the privacy check.</p></main></body></html>`);
    await page.locator('p').nth(1).selectText();
    const requestsBeforeReaderActions = requests.length;
    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });

    const saved = await send('SAVE_PLACE') as { sentence?: string; error?: string };
    const resumed = await send('RESUME_PLACE') as { sentence?: string; error?: string };
    const reading = await send('PLAY_PAUSE') as { speaking: boolean; error?: string };
    expect(saved).toMatchObject({ sentence: articleSentence });
    expect(resumed).toMatchObject({ sentence: articleSentence });
    expect(reading.error).toBeUndefined();
    expect(reading.speaking).toBe(true);
    await send('PLAY_PAUSE');

    const networkRequests = requests.filter(({ url }) => /^https?:/.test(url));
    expect(requests).toHaveLength(requestsBeforeReaderActions);
    expect([...new Set(networkRequests.map(({ url }) => new URL(url).origin))]).toEqual(['http://127.0.0.1:4173']);
    expect(JSON.stringify(networkRequests)).not.toContain(articleSentence);
    expect(JSON.stringify(networkRequests)).not.toContain(encodeURIComponent(articleSentence));
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:local-browser-storage packaged extension stores normal anchors and settings locally', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-local-normal-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/privacy/');
    const savedSentence = 'This normal article sentence belongs in local extension storage.';
    await page.setContent(`<main><p>Start of article.</p><p>${savedSentence}</p><p>End of article.</p></main>`);
    await page.locator('p').nth(1).selectText();
    const saved = await worker.evaluate(async ({ targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type: 'SAVE_PLACE' });
    }, { targetUrl: page.url() }) as { sentence?: string };
    expect(saved.sentence).toBe(savedSentence);

    const extensionId = new URL(worker.url()).host;
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await options.locator('#fontSize').evaluate((input: HTMLInputElement) => {
      input.value = '24';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.locator('#lineHeight').evaluate((input: HTMLInputElement) => {
      input.value = '1.8';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.getByLabel('Paper light').check();
    await options.getByLabel('Reduce surrounding page brightness while the strip is open').check();
    await options.getByRole('button', { name: 'Save reading settings' }).click();
    await expect(options.locator('#save-status')).toHaveText('Saved. Open strips update automatically.');

    const stored = await worker.evaluate(() => chrome.storage.local.get(null)) as Record<string, unknown>;
    const normalAnchorKeys = Object.keys(stored).filter((key) => key.startsWith('anchor:'));
    expect(normalAnchorKeys).toHaveLength(1);
    expect(normalAnchorKeys[0]).toContain('/privacy/');
    expect(stored[normalAnchorKeys[0]!]).toMatchObject({ sentence: savedSentence });
    expect(stored.readingSettings).toMatchObject({ fontSize: 24, lineHeight: 1.8, theme: 'light', dimPage: true });
    expect(Object.keys(stored).some((key) => key.startsWith('demo:'))).toBe(false);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:plus-presets a recorded valid license exposes three presets and persists each one', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-presets-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    const fixture = JSON.parse(await readFile(resolve('tests/fixtures/valid-license.json'), 'utf8')) as {
      license: string;
      response: { valid: boolean; reason: string; expires_at: null };
    };
    let verificationRequests = 0;
    await context.route((url) => url.origin === 'https://api.sociobot.in'
      && url.pathname === '/api/v1/products/dyslexia-reading-resume/verify', async (route) => {
      verificationRequests += 1;
      expect(new URL(route.request().url()).searchParams.get('license')).toBe(fixture.license);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture.response) });
    });
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await options.getByLabel('Have a license?').fill(fixture.license);
    await options.getByRole('button', { name: 'Verify' }).click();
    await expect(options.locator('#license-status')).toHaveText('Plus is active on this device.');
    await expect(options.locator('#presets button')).toHaveCount(3);

    const presets = [
      { name: 'Calm night', settings: { fontSize: 21, lineHeight: 1.75, stripWidth: 720, theme: 'dark' } },
      { name: 'Paper day', settings: { fontSize: 20, lineHeight: 1.7, stripWidth: 680, theme: 'light' } },
      { name: 'Wide focus', settings: { fontSize: 23, lineHeight: 1.6, stripWidth: 920, theme: 'page' } }
    ] as const;
    for (const preset of presets) {
      await options.getByRole('button', { name: preset.name }).click();
      await expect(options.locator('#save-status')).toHaveText('Plus preset applied and saved.');
      await expect.poll(() => worker!.evaluate(async () => (await chrome.storage.local.get('readingSettings')).readingSettings))
        .toMatchObject(preset.settings);
    }

    await options.reload();
    await expect(options.locator('#fontSizeOut')).toHaveText('23 px');
    await expect(options.locator('#stripWidthOut')).toHaveText('920 px');
    await expect(options.getByLabel('Device')).toBeChecked();
    expect(verificationRequests).toBe(1);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:offline-extension the packaged free reader works on an already loaded article while offline', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-offline-extension-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/privacy/');
    const offlineSentence = 'The offline reader saves this sentence without a network connection.';
    await page.setContent(`<main><p>Offline article opening.</p><p>${offlineSentence}</p><p>Offline article ending.</p></main>`);
    await page.locator('p').nth(1).selectText();
    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Offline article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });

    await context.setOffline(true);
    expect(await send('SAVE_PLACE')).toMatchObject({ hasAnchor: true, sentence: offlineSentence });
    expect(await send('RESUME_PLACE')).toMatchObject({ stripOpen: true, sentence: offlineSentence });
    expect(await send('NEXT_SENTENCE')).toMatchObject({ stripOpen: true });
    expect(await send('PLAY_PAUSE')).toMatchObject({ speaking: true });
    await send('PLAY_PAUSE');
    const extensionId = new URL(worker.url()).host;
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(options.getByRole('heading', { level: 1 })).toHaveText('Make the next sentence comfortable.');
  } finally {
    await context.setOffline(false);
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('@claim:free-core an unlicensed packaged extension performs every free reader action', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const extensionPath = resolve('dist/extension/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'reading-resume-free-core-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    expect(await worker.evaluate(() => chrome.storage.local.get(null))).toEqual({});
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/privacy/');
    const freeSentence = 'The free reader returns to this selected sentence.';
    await page.setContent(`<main><p>Free article opening.</p><p>${freeSentence}</p><p>Free article ending.</p></main>`);
    await page.locator('p').nth(1).selectText();
    const send = async (type: string) => worker!.evaluate(async ({ type, targetUrl }) => {
      const tab = (await chrome.tabs.query({})).find((item) => item.url === targetUrl);
      if (!tab?.id) throw new Error('Free article tab not found');
      return chrome.tabs.sendMessage(tab.id, { type });
    }, { type, targetUrl: page.url() });
    expect(await send('SAVE_PLACE')).toMatchObject({ hasAnchor: true, sentence: freeSentence });
    await send('NEXT_SENTENCE');
    expect(await send('RESUME_PLACE')).toMatchObject({ stripOpen: true, sentence: freeSentence });
    expect(await send('PLAY_PAUSE')).toMatchObject({ speaking: true });
    await send('PLAY_PAUSE');

    const extensionId = new URL(worker.url()).host;
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(options.locator('#presets')).toBeHidden();
    await options.locator('#fontSize').evaluate((input: HTMLInputElement) => {
      input.value = '26';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.locator('#lineHeight').evaluate((input: HTMLInputElement) => {
      input.value = '1.9';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.locator('#stripWidth').evaluate((input: HTMLInputElement) => {
      input.value = '880';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.locator('#rate').evaluate((input: HTMLInputElement) => {
      input.value = '0.75';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.locator('#pauseMs').evaluate((input: HTMLInputElement) => {
      input.value = '600';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await options.getByLabel('Paper light').check();
    await options.getByLabel('Reduce surrounding page brightness while the strip is open').check();
    await options.getByRole('button', { name: 'Save reading settings' }).click();
    await expect(options.locator('#save-status')).toHaveText('Saved. Open strips update automatically.');
    await expect.poll(() => worker!.evaluate(async () => (await chrome.storage.local.get('readingSettings')).readingSettings))
      .toMatchObject({ fontSize: 26, lineHeight: 1.9, stripWidth: 880, rate: 0.75, pauseMs: 600, dimPage: true, theme: 'light' });

    const downloadPromise = options.waitForEvent('download');
    await options.getByRole('button', { name: 'Export saved places' }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).not.toBeNull();
    const exported = JSON.parse(await readFile(path!, 'utf8')) as { anchors: { sentence: string }[] };
    expect(exported.anchors.map((item) => item.sentence)).toContain(freeSentence);
    const stored = await worker.evaluate(() => chrome.storage.local.get(null)) as Record<string, unknown>;
    expect(stored['sb_license:dyslexia-reading-resume']).toBeUndefined();
    expect(stored.licenseCache).toBeUndefined();
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
