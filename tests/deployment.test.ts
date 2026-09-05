import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  it('defines the delivery behavior needed for the static artifact', () => {
    const headers = readFileSync(resolve('site/public/_headers'), 'utf8');
    const swaConfig = JSON.parse(readFileSync(resolve('site/public/staticwebapp.config.json'), 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: { route: string; headers?: Record<string, string> }[];
      responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
      mimeTypes: Record<string, string>;
    };
    expect(headers).toContain('/assets/*\n  Cache-Control: public, max-age=31536000, immutable');
    expect(swaConfig.globalHeaders['Content-Security-Policy']).toMatch(/frame-ancestors 'none'/);
    expect(swaConfig.globalHeaders['Permissions-Policy']).toContain('payment=()');
    expect(swaConfig.mimeTypes['.zip']).toBe('application/zip');
    expect(swaConfig.mimeTypes['.avif']).toBe('image/avif');
    expect(swaConfig.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
    expect(swaConfig.routes.find((route) => route.route === '/sw.js')?.headers?.['Cache-Control']).toBe('no-cache');
  });
});
