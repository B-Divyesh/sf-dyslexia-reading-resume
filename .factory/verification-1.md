# Independent verification — FAIL

Date: 2026-08-28  
Work order: `dyslexia-reading-resume-verify-1`  
Candidate commit: `e7e5db7d4a4eed4533fd9c18f2cce2c3d9f850b3`  
Live URL: `https://dyslexia-reading-resume.sociobot.in/`

## Verdict

**FAIL.** The candidate cannot be accepted as the browser extension described in the brief. A selected sentence is saved as a different sentence, and the live product's only extension-download URL serves HTML rather than the packaged extension. The latter is a deployment mismatch: the live home HTML exactly matches the candidate, while the linked ZIP does not exist at the deployed URL.

No product source was modified during verification. This report and the handoff are the only changes.

## Blocking defects

### Critical — selected sentence is not saved

In packaged Chromium MV3, on a page with three sentences, I selected **“Second sentence is the selected sentence to save.”** and sent the same `SAVE_PLACE` message used by the popup/shortcut. The saved anchor returned **“First sentence is intentionally ordinary.”** instead. This violates the product's core sentence-level return-point promise and the landing-page claim that the user can “Select text … then save.”

The cause is consistent with `sentenceNearestViewport()` testing whether each sentence range intersects the selection's common-ancestor node; all sentence ranges under one text parent can match and the first match wins. This was reproduced against `dist/extension/chrome-mv3`, not only source code.

### Critical — live download cannot install the product

The production landing page links every download CTA to `/downloads/reading-resume-chrome.zip`. On the live URL that request returns:

```
HTTP/2 200
content-type: text/html
content-length: 8762
sha256: 6d9970a23cc761e79c00e2a8ef5e91179c2ee7f5af0edd07a83fc53e48ffc851
```

It is the live home HTML (same SHA-256), not a ZIP (`PK` header absent). The locally built candidate ZIP exists and has SHA-256 `ee0bd49d7688ac0696865dfd777f29267b929d9d0f1a0b1e72a921e74cc732de`. A new user following the real installation flow therefore cannot acquire the extension.

### High — clean-checkout quality commands fail before the build

After `npm ci` in the candidate checkout, both commands fail because the committed `tsconfig.json` extends generated, absent `.wxt/tsconfig.json`:

```
npm test
TSConfckParseError: failed to resolve "extends":"./.wxt/tsconfig.json"

npm run check
TS5083: Cannot read file '/work/repo/.wxt/tsconfig.json'.
```

`npm run build` generates that file; only then do `npm test` (6 tests) and `npx tsc --noEmit` pass. This does not meet the clean-checkout test/type-check acceptance gate.

## Other defects

### Moderate — 390 CSS-pixel mobile page overflows horizontally

At an actual `390 × 844` CSS viewport, the built home page reports `document.documentElement.scrollWidth = 429`. The overflowing elements are `.hero-art`, its `<picture>`, and the hero `<img>`; the mobile stylesheet sets `.hero-art { width: 110% }`. `body { overflow-x: hidden }` masks the visual excess but does not satisfy the no-overflow mobile check and risks clipping content/effects.

### Moderate — empty license token gives the wrong recovery message

Submitting the empty options-page license form displays “Could not reach the license service. Your free reader still works offline.” The lower-level validator has the useful error “Enter the license token from your receipt,” but the form catches and discards it. This is an invalid-input/recovery-path defect in the paid-unlock flow; the free reader remains available.

### Moderate — cache/update policy does not meet the requested static/PWA policy

Live hashed JS, CSS, font, image, service-worker, and HTML responses all have only `Cache-Control: public, must-revalidate, max-age=30`, with no immutable asset caching. The service worker's cache name is fixed at `reading-resume-v1`; future service-worker updates using this code will retain the same cache rather than version/invalidate it. Current local registration and offline reload work, but its update strategy is not safely versioned.

### Low — missing browser hardening response policies

The live page supplies HSTS, `X-Content-Type-Options: nosniff`, and Referrer-Policy, but no `Content-Security-Policy`, `Permissions-Policy`, or `X-Frame-Options`/`frame-ancestors` policy. This is defense-in-depth for a static page, but should be resolved by deployment configuration.

## Evidence that passed

- Clean dependency installation: `npm ci` completed. `npm audit --omit=dev --json` reports **0 production vulnerabilities**. (`npm audit` including development tooling reports 12 vulnerabilities; they are not production dependencies.)
- Exact production build: `npm run build` passed. It produced `dist/extension/chrome-mv3/`, `dist/site/`, and `dist/site/downloads/reading-resume-chrome.zip`.
- After the build-generated WXT config exists: `npm test` passed **6/6** and `npx tsc --noEmit` passed.
- Repository Playwright suite: `npm run test:e2e` passed **10 tests, 2 intentional project skips**. Its service-worker result is recorded in `test-results/.last-run.json` as `passed`.
- Independent packaged-extension exercise: no-anchor, changed-page, no-readable-text, first/last sentence boundary, local save/reload/restore, blank input, keyboard Tab focus, and options-page axe scan were exercised. No page/console errors; the options-page serious/critical axe list was empty. Changed-page recovery correctly says to save a new place; no-text recovery correctly says no readable article text was found.
- Independent axe scans found no serious/critical violations on packaged extension options or live `/`, `/privacy/`, and `/terms/`. The live page had no console/page errors in a 390-mobile browser session.
- Keyboard focus: the site skip link and options button showed a visible 3px focus outline. Reduced-motion media rules reduced transition/animation duration to `0.01ms` locally.
- Local PWA: service worker registered and controlled after reload; an offline reload returned `200` with the expected title and H1 and no errors. Its future cache-version defect is listed above.
- Privacy/outbound scan: no analytics, runtime CDN, cloud article-text request, or tracker was observed. Initial live runtime traffic was same-origin only. Source review finds only the Sociobot checkout/verify endpoints, invoked for the optional license path; anchors/settings use `browser.storage.local`.
- Performance/build budgets: built site JS is 2.33 kB, CSS 12.69 kB, local font 54.35 kB, 800px AVIF 10.53 kB / WebP 17.61 kB, and packaged extension 42.84 kB—all below the stated transfer budgets. A local Lighthouse run produced FCP 1.0 s, LCP 1.4 s, CLS 0, TBT 0 ms, but exited non-zero after a browser-tab crash; treat its category scores as non-authoritative.
- Live identity: `/` SHA-256 is `6d9970a23cc761e79c00e2a8ef5e91179c2ee7f5af0edd07a83fc53e48ffc851`, exactly matching this candidate's `dist/site/index.html`. The deployment mismatch is specifically the omitted/unserved download artifact, not the home document.

## Required remediation before re-verification

1. Correct selected-range sentence resolution; add a packaged-extension test that selects a non-first sentence in a common text parent and asserts that exact anchor.
2. Publish `/downloads/reading-resume-chrome.zip` as the candidate ZIP with a ZIP content type, then verify it downloads and opens with `manifest.json` at archive root.
3. Make `npm test` and `npm run check` work from a clean checkout without a prior build (or make the scripts generate WXT types themselves).
4. Remove the 390px overflow and add a CSS-viewport mobile regression test.
5. Preserve the specific blank-license validation message; version service-worker caches and configure immutable caching/security headers at deployment.
