import { getLicenseCache, setLicenseCache } from './storage';
import type { LicenseCache } from './types';

export const PRODUCT_SLUG = 'dyslexia-reading-resume';
export const BUY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/checkout`;
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify`;
const DAY = 86_400_000;

export async function licenseState(force = false): Promise<LicenseCache | undefined> {
  const cache = await getLicenseCache();
  if (!cache?.token) return undefined;
  if (!force && Date.now() - cache.checkedAt < DAY) return cache;
  return verifyLicense(cache.token, cache);
}

export async function verifyLicense(token: string, previous?: LicenseCache): Promise<LicenseCache> {
  const clean = token.trim();
  if (!clean) throw new Error('Enter the license token from your receipt.');
  try {
    const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(clean)}`);
    if (!response.ok) throw new Error('The license service is unavailable.');
    const result = await response.json() as { valid: boolean; reason?: string };
    const cache = { token: clean, valid: result.valid, checkedAt: Date.now(), reason: result.reason };
    await setLicenseCache(cache);
    return cache;
  } catch (error) {
    if (previous?.valid) return previous;
    throw error;
  }
}
