import { licenseState, verifyLicense } from '../../lib/license';
import { ANCHOR_PREFIX, getSettings, listAnchors, setSettings } from '../../lib/storage';
import type { ReadingSettings } from '../../lib/types';
import './style.css';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
let settings: ReadingSettings;

function readForm(): ReadingSettings {
  const form = new FormData($('#settings-form') as HTMLFormElement);
  return {
    fontSize: Number(form.get('fontSize')),
    lineHeight: Number(form.get('lineHeight')),
    stripWidth: Number(form.get('stripWidth')),
    rate: Number(form.get('rate')),
    pauseMs: Number(form.get('pauseMs')),
    dimPage: form.get('dimPage') === 'on',
    theme: form.get('theme') as ReadingSettings['theme']
  };
}

function fillForm(value: ReadingSettings): void {
  (Object.keys(value) as (keyof ReadingSettings)[]).forEach((key) => {
    const input = document.querySelector<HTMLInputElement>(`[name="${key}"]${key === 'theme' ? `[value="${value[key]}"]` : ''}`);
    if (!input) return;
    if (input.type === 'checkbox') input.checked = Boolean(value[key]);
    else if (input.type === 'radio') input.checked = true;
    else input.value = String(value[key]);
  });
  updatePreview();
}

function updatePreview(): void {
  const value = readForm();
  $('#fontSizeOut').textContent = `${value.fontSize} px`;
  $('#lineHeightOut').textContent = `${value.lineHeight}×`;
  $('#stripWidthOut').textContent = `${value.stripWidth} px`;
  $('#rateOut').textContent = `${value.rate}×`;
  $('#pauseMsOut').textContent = `${value.pauseMs} ms`;
  const preview = $('#preview');
  preview.style.setProperty('--preview-size', `${value.fontSize}px`);
  preview.style.setProperty('--preview-leading', String(value.lineHeight));
  preview.className = `preview ${value.theme === 'light' ? 'light' : ''}`;
}

async function initLicense(): Promise<void> {
  const cache = await licenseState().catch(() => undefined);
  if (cache?.valid) unlockPlus();
  else if (cache && !cache.valid) $('#license-status').textContent = 'This license is no longer active.';
}

function unlockPlus(): void {
  $('#presets').hidden = false;
  $('#license-status').textContent = 'Plus is active on this device.';
}

async function init(): Promise<void> {
  settings = await getSettings();
  fillForm(settings);
  $('#settings-form').addEventListener('input', updatePreview);
  $('#settings-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    settings = readForm();
    await setSettings(settings);
    $('#save-status').textContent = 'Saved. Open strips update automatically.';
  });
  $('#license-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = $('#license-status');
    status.textContent = 'Checking license…';
    try {
      const result = await verifyLicense(($<HTMLInputElement>('#license')).value);
      if (result.valid) unlockPlus();
      else status.textContent = 'That license is not active. Check the token and try again.';
    } catch {
      status.textContent = 'Could not reach the license service. Your free reader still works offline.';
    }
  });
  $('#presets').addEventListener('click', (event) => {
    const preset = (event.target as HTMLButtonElement).dataset.preset;
    if (preset === 'calm') settings = { ...settings, fontSize: 21, lineHeight: 1.75, stripWidth: 720, theme: 'dark' };
    if (preset === 'paper') settings = { ...settings, fontSize: 20, lineHeight: 1.7, stripWidth: 680, theme: 'light' };
    if (preset === 'wide') settings = { ...settings, fontSize: 23, lineHeight: 1.6, stripWidth: 920, theme: 'page' };
    fillForm(settings);
    void setSettings(settings);
    $('#save-status').textContent = 'Plus preset applied and saved.';
  });
  $('#export').addEventListener('click', async () => {
    const data = JSON.stringify({ product: 'Reading Resume', exportedAt: new Date().toISOString(), anchors: await listAnchors() }, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download = `reading-resume-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    $('#data-status').textContent = 'Saved places exported.';
  });
  $('#clear').addEventListener('click', async () => {
    if (!confirm('Clear every saved sentence from this device? This cannot be undone.')) return;
    const all = await browser.storage.local.get(null);
    await browser.storage.local.remove(Object.keys(all).filter((key) => key.startsWith(ANCHOR_PREFIX)));
    $('#data-status').textContent = 'All saved places were cleared.';
  });
  await initLicense();
}

void init();
