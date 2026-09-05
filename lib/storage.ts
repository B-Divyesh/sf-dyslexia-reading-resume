import type { LicenseCache, ReadingSettings, SentenceAnchor } from './types';
import { DEFAULT_SETTINGS } from './types';

export const ANCHOR_PREFIX = 'anchor:';
export const DEMO_ANCHOR_PREFIX = 'demo:anchor:';
export const SETTINGS_KEY = 'readingSettings';
export const LICENSE_KEY = 'sb_license:dyslexia-reading-resume';
export const LICENSE_CACHE_KEY = 'licenseCache';

export function normalizePageUrl(input: string): string {
  const url = new URL(input);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.toString();
}

export function anchorKey(input: string): string {
  return `${isDemoUrl(input) ? DEMO_ANCHOR_PREFIX : ANCHOR_PREFIX}${normalizePageUrl(input)}`;
}

export function isDemoUrl(input: string): boolean {
  const url = new URL(input);
  return url.pathname === '/demo' || url.pathname === '/demo/' || url.searchParams.get('demo') === '1';
}

export async function getAnchor(url: string): Promise<SentenceAnchor | undefined> {
  const key = anchorKey(url);
  return (await browser.storage.local.get(key))[key] as SentenceAnchor | undefined;
}

export async function setAnchor(anchor: SentenceAnchor): Promise<void> {
  await browser.storage.local.set({ [anchorKey(anchor.url)]: anchor });
}

export async function removeAnchor(url: string): Promise<void> {
  await browser.storage.local.remove(anchorKey(url));
}

export async function listAnchors(demo = false): Promise<SentenceAnchor[]> {
  const all = await browser.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith(demo ? DEMO_ANCHOR_PREFIX : ANCHOR_PREFIX))
    .map(([, value]) => value as SentenceAnchor)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function getSettings(): Promise<ReadingSettings> {
  const stored = (await browser.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY] as Partial<ReadingSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSettings(settings: ReadingSettings): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getLicenseCache(): Promise<LicenseCache | undefined> {
  return (await browser.storage.local.get(LICENSE_CACHE_KEY))[LICENSE_CACHE_KEY] as LicenseCache | undefined;
}

export async function setLicenseCache(cache: LicenseCache): Promise<void> {
  await browser.storage.local.set({ [LICENSE_KEY]: cache.token, [LICENSE_CACHE_KEY]: cache });
}
