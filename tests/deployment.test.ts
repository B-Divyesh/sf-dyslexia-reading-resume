import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  it('declares immutable hashed-asset caching and browser hardening headers', () => {
    const headers = readFileSync(resolve('site/public/_headers'), 'utf8');
    const swaConfig = readFileSync(resolve('site/public/staticwebapp.config.json'), 'utf8');
    expect(headers).toContain('/assets/*\n  Cache-Control: public, max-age=31536000, immutable');
    expect(headers).toContain("Content-Security-Policy: default-src 'self'");
    expect(headers).toContain('Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()');
    expect(headers).toContain('X-Frame-Options: DENY');
    expect(swaConfig).toContain('"/downloads/*"');
    expect(swaConfig).toContain('".zip": "application/zip"');
    expect(swaConfig).toContain('"Cache-Control": "public, max-age=31536000, immutable"');
  });
});
