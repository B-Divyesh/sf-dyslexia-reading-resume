# Independent verification 2 — FAIL

Date: 2026-08-28
Work order: `dyslexia-reading-resume-verify-2`
Candidate: `a6412a18d21b8881e6953a3c2129d094caa34a64`
Live URL: <https://dyslexia-reading-resume.sociobot.in/>

## Verdict

**FAIL — release blocker.** The repair candidate is buildable, its production site and install ZIP are deployed correctly, and most functional and quality checks pass. However, the browser extension does not reliably return to the *exact occurrence* of a saved sentence: when the same sentence appears twice, it resumes at the first occurrence even when the second was selected and saved. That directly fails the brief's central job-to-be-done and must be corrected before acceptance.

No product source or assets were changed during this verification. This report and the handoff are the only committed changes.

## Blocking defect

### High — duplicate sentences resume to the wrong occurrence

Reproduced in a clean, persistent Chromium profile using the freshly built MV3 package (`dist/extension/chrome-mv3`):

1. On one page, created five paragraphs, with `Duplicate marker sentence.` in paragraph indexes 1 and 3.
2. Selected paragraph 3 and invoked the extension's real `SAVE_PLACE` message.
3. Invoked the real `RESUME_PLACE` message without changing the document.
4. Inspected the `reading-resume-current` CSS Highlight range. It was paragraph index **1**, not the saved index **3**.

The source cause is visible in `lib/sentences.ts`: `bestSentenceIndex()` immediately returns the first exact normalized-text match. The saved `sentenceIndex`, `prefix`, and `suffix` are not used for exact duplicate disambiguation. A reader can therefore be returned to the wrong sentence in repetitive articles, captions, transcripts, or repeated notices. This violates “stop and resume ... at the exact sentence” and the proposed success measure.

Required repair: choose among exact matches using persisted neighboring context and/or a strongly weighted saved index, then add this exact packaged-extension regression case (select the second of two identical sentences and assert the highlighted range remains the second).

## What passed

### Clean checkout and build

- `npm ci` completed from the clean candidate checkout.
- `npm test`: **8/8** unit/integration tests passed.
- `npx tsc --noEmit` passed.
- `npm run check` passed from clean dependencies: WXT type preparation, TypeScript, 8 tests, and the production build.
- `npm run build` and `npm run build:extension` passed. The MV3 output is **42.96 kB** total and `dist/site/downloads/reading-resume-chrome.zip` is produced with `manifest.json` at archive root.
- `npm run test:e2e` passed; Playwright recorded `test-results/.last-run.json` as `passed` after the full **22-test**, desktop + 390px-mobile suite (including the packaged extension, site, offline reload, ZIP, and axe checks).
- `npm audit --omit=dev` reports **0 production vulnerabilities**. The unrestricted developer-tool audit reports 12 vulnerabilities (2 moderate, 6 high, 4 critical); these are development dependencies, not shipped runtime code.

### Core functional exercise

- Normal flow in a real packaged extension: saved `Saved sentences remain in extension storage on your device.`, reloaded the page, and resumed the same anchor with no console/page errors.
- Selected a later sentence in one shared text node; it saved that selected sentence, confirming the previously reported selection-range issue is repaired.
- Changed-page recovery gave: `The page changed and the saved sentence could not be matched. Save a new place.` A new save immediately recovered successfully.
- No-readable-text boundary (`<p>x</p>`) gave: `No readable article text was found on this page.`
- Maximum options boundaries persisted correctly: 30 px text size and 2x line height saved to `chrome.storage.local`.
- Empty license validation is specific: `Enter the license token from your receipt.`
- Local PWA service-worker activation/offline reload passed through the repository test; the built worker has a concrete release cache ID and removes prior Reading Resume caches.

### Live deployment identity, privacy, and policies

- Live `/` SHA-256 is `cc529246c2cd8ba57db13c4a47c6b9e776c97e2d31076814c4a9112d8aa00126`, exactly matching the candidate build. Live `/sw.js` also exactly matches.
- Live `/downloads/reading-resume-chrome.zip` is `200 application/zip`, 23,311 bytes. The fresh ZIP file hash differs only because ZIP timestamps differ; all 19 unzipped entry payload SHA-256 values match the candidate package exactly. Thus the publicly downloadable extension payload matches this candidate.
- Live headers: HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP restricting scripts/fonts/images to self and connections to self plus the optional Sociobot API, and a Permissions-Policy disabling camera/geolocation/microphone/payment/USB. HTML is revalidated; hashed assets are `public, max-age=31536000, immutable`; `/sw.js` is `no-cache`.
- Live desktop and mobile initial requests were same-origin only; no runtime CDN, analytics, cookies, or article-text transmission was observed. Source review confirms anchors/settings use `browser.storage.local`; the only cross-origin product endpoints are optional Sociobot checkout/verify paths for the Plus license.

### Accessibility, responsive behavior, and performance

- Repository axe tests found zero serious/critical violations on site `/`, `/privacy/`, `/terms/` and extension popup/options. Independent live desktop and mobile axe scans also found zero serious/critical results.
- Desktop and responsive 390px checks had no horizontal overflow; mobile primary download control remained visible. The first keyboard Tab reaches the skip link, whose measured focus outline is `rgb(99, 216, 207) solid 3px`; keyboard Space toggled the landing-page read-aloud example. Extension settings and popup have visible `:focus-visible` rules and keyboard-controlled controls.
- Under `prefers-reduced-motion: reduce`, the live demo reports `animation-name: none` and 0.01 ms reduced animation/transition duration, while the extension strip disables its entrance animation.
- No live desktop/mobile page errors or console errors were observed in the independent browser sessions.
- Built static budgets: initial JS 2.33 kB, CSS 12.69 kB + 47 B, local font 54.35 kB, 800px AVIF 10.53 kB / WebP 18.41 kB, and extension 42.96 kB — all below stated budgets.
- Local mobile Lighthouse 13.4.1: **Performance 100**, **Accessibility 100**; LCP **1.4 s**, CLS **0**, TBT **80 ms**. (The initial Lighthouse invocation could not locate Chrome; rerun with the preinstalled Playwright Chromium completed.)

## Retest command set

```sh
npm ci
npm test
npx tsc --noEmit
npm run check
npm run build
npm run build:extension
npm run test:e2e
npm audit --omit=dev
```

After the duplicate-anchor repair, re-run the command set and a packaged Chromium test that selects the later duplicate sentence. No deployment action is currently needed: fresh live evidence confirms the current site and package payload correspond to this candidate.
