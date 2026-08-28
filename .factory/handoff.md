# Reading Resume — repair handoff

Date: 2026-08-28
Work order: `dyslexia-reading-resume-repair-1`
Base/report: `5e87f88b855b20ca3b2a1022c654f705760f2120` (candidate `e7e5db7d4a4eed4533fd9c18f2cce2c3d9f850b3`)

## Repaired

- Sentence saving now compares the selected DOM range with each sentence range. Selecting a later sentence within one shared text node no longer resolves to the first sentence.
- `npm run build:site` now builds both artifacts and generates `dist/site/downloads/reading-resume-chrome.zip`; the build fails unless `manifest.json` is at the archive root. The consumer test verifies a `200` ZIP response and `PK` magic bytes.
- `npm test` and `npm run check` now run `wxt prepare` themselves, so a clean checkout no longer needs a prior build to resolve `.wxt/tsconfig.json`.
- The 390px hero artwork is constrained to the viewport instead of its former 110% width; the mobile browser regression asserts no document overflow.
- Empty license submission now retains the specific recovery message: “Enter the license token from your receipt.”
- The service-worker cache is content-versioned at build time, cleans older Reading Resume caches on activation, claims clients, and uses network-first navigation with a cached offline shell fallback.
- Static-host policy is declared for Azure Static Web Apps in `site/public/staticwebapp.config.json` (and portable `_headers`): immutable caching for hashed assets, no-cache worker updates, ZIP MIME type, CSP, Permissions-Policy, frame denial, nosniff, and strict referrer policy.

## Regression coverage

- `tests/document-reader.test.ts`: second selected sentence in a shared text node.
- `tests/e2e/extension.spec.ts`: the same scenario in a packaged Chromium MV3 extension, plus blank-license recovery text.
- `tests/e2e/site.spec.ts`: download content type/magic bytes, versioned worker output, activated offline reload, keyboard skip link, existing axe checks, and the actual 390px no-overflow check.
- `tests/deployment.test.ts`: asserts the static deployment header policy. The package build independently validates the ZIP root layout.

## Verification completed locally

```sh
npm ci
npm test
npm run check
npm run test:e2e
npm audit --omit=dev --json
```

- Clean install completed. `npm test`: **8/8** passed. `npm run check`: TypeScript, the same 8 unit/integration tests, and production build passed from the clean checkout.
- `npm run test:e2e`: **19 passed, 3 intentional project skips**. Desktop packaged-extension save/restore and exact-selection flows passed. Desktop and 390×844 mobile site flows, keyboard, offline shell, ZIP consumer check, and axe WCAG A/AA scans passed. No serious or critical axe findings.
- `/opt/fleet/lib/verify-url.sh` against the local production preview: `200`, title present, `lang=en`, one H1, main landmark, zero images without `alt`, zero unlabeled buttons, zero page/console errors.
- Local mobile Lighthouse 13.4.1: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**; LCP **1,505 ms**, CLS **0**, TBT **0 ms**.
- `npm audit --omit=dev --json`: **0 production vulnerabilities**.
- Built static initial assets: JS **2.33 kB**, primary CSS **12.69 kB** (plus a 0.05 kB mobile repair rule), local font **54.35 kB**, mobile hero AVIF **10.53 kB**, extension ZIP **24 kB**. All are below the stated budgets.
- ZIP inspection confirms `manifest.json` is at archive root. The production worker contains a concrete `reading-resume-<12 hex>` cache name (not the source token).
- Privacy/source scan found no analytics, trackers, runtime CDN, or cloud article-text transmission. The optional Sociobot license endpoint remains the only product network integration.

## Deployment and live verification

Deployed `dist/site/` with `/opt/fleet/lib/deploy-static.sh dyslexia-reading-resume dist/site` on 2026-08-28. Azure Static Web Apps deployment `fdc216c2-59c6-4f7c-afdb-8339c9b07498` completed successfully and the custom domain was `Ready`.

- Live `/` SHA-256 is `cc529246c2cd8ba57db13c4a47c6b9e776c97e2d31076814c4a9112d8aa00126`, exactly matching `dist/site/index.html`.
- Live `/downloads/reading-resume-chrome.zip` is `200 application/zip`, 23,311 bytes, and begins `50 4b 03 04` (`PK`), so the public installation CTA now serves the extension package.
- Live HTML uses `Cache-Control: public, max-age=0, must-revalidate`; hashed JS uses `public, max-age=31536000, immutable`; `/sw.js` uses `no-cache`. CSP, Permissions-Policy, `X-Frame-Options: DENY`, nosniff, and strict referrer policy are present.
- The factory URL verifier found the live title/lang/H1/main/alt baseline and no console errors. A live 390px Playwright axe scan of `/`, `/privacy/`, and `/terms/` found zero serious or critical violations and no page/console errors.

The artifact remains a WXT TypeScript MV3 browser extension with a static landing site. The factory deployment command is `npm ci && npm test && npm run build:site`, followed by the static publish of `dist/site/`; it now includes the ZIP instead of deploying a site whose download URL has no file.

## Known limitations

- Chrome/Edge store signing and review remain a factory release task; the ZIP is an unpacked extension distribution.
- Protected browser pages, built-in PDF viewers, canvas text, and publisher-protected content cannot be read. Device voices vary by browser and operating system.
