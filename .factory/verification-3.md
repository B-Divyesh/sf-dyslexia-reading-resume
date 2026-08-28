# Independent verification 3 — PASS

Date: 2026-08-28  
Work order: `dyslexia-reading-resume-verify-3`  
Candidate commit: `cc63cdeb1bd0d99e076b5ca3691d294ebfe80a76`  
Live URL: <https://dyslexia-reading-resume.sociobot.in/>

## Verdict

**PASS.** This candidate fulfils the brief's core job: a packaged MV3 extension saves the selected sentence locally and returns to that same occurrence after reload/navigation, including duplicate sentences. The public site and downloadable extension package match the candidate build. No release-blocking functional, privacy, accessibility, mobile, offline, or response-policy defect was found.

No product source or asset was modified during this verification. This report and the handoff are the only changes.

## Clean-checkout verification

A fresh detached clone was created at the exact SHA above in `/tmp/reading-resume-qa-w3DUXn`.

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev --json
```

- `npm ci`: passed.
- `npm run check`: passed: WXT type preparation, `tsc --noEmit`, and Vitest **10/10**; its exact production build produced `dist/extension/chrome-mv3/`, `dist/site/`, and `dist/site/downloads/reading-resume-chrome.zip`.
- `npm run test:e2e`: passed. Playwright's final result is `passed`; all **24** desktop/390px cases passed (with the expected project skips for extension-only desktop tests).
- `npm audit --omit=dev`: **0** production vulnerabilities. The unrestricted toolchain audit reports 12 development-only findings (2 moderate, 6 high, 4 critical); none are shipped in the static site or extension.

## End-to-end product evidence

Using a clean persistent Chromium profile loaded from the freshly built unpacked MV3 package:

- Before saving, Resume returns: `No saved place for this page yet. Save a sentence first.`
- A specifically selected middle sentence saved exactly; normal reload/resume and the repository's real packaged-extension test passed.
- The candidate's duplicate-sentence regression selected the second duplicate and resumed to that same occurrence, not the first.
- First/last sentence navigation remains usable at both boundaries.
- A small article-text revision recovered through the conservative fuzzy matcher; a wholly changed page returns: `The page changed and the saved sentence could not be matched. Save a new place.`
- A no-text page returns: `No readable article text was found on this page.`
- Fragment and UTM-normalized URL variants restored the same anchor.
- Anchors were observed in `chrome.storage.local`; settings min/max values persisted; export contained the local anchor; confirmed clear removed anchors; blank license input gave the specific recovery text. An unsupported extension/browser page disables controls and explains the limitation.
- No console errors or page errors occurred in these flows.

## Accessibility, responsive, offline, and performance

- Repository axe checks found **zero serious/critical** findings for `/`, `/privacy/`, `/terms/`, popup, and options. The landing page has `lang`, a title, one H1, `main`, a keyboard-operable skip link, and the tested visible focus treatment. The options destructive control exposes a visible `3px` teal focus outline.
- Desktop and 390px Playwright cases passed with no horizontal overflow and a reachable primary download action. Keyboard Enter activates the skip link; the example read-aloud button is keyboard-operable.
- Reduced-motion runs opened the strip successfully; site rules replace motion with effectively instant states and the extension disables strip entrance animation.
- The built service worker has a release-versioned cache. Local offline reload passed after activation; on the live site, `registration.update()` completed and a reloaded page remained controlled by the service worker.
- Mobile Lighthouse 12.8.2 against the production build: **Performance 100**, **Accessibility 100**, FCP **1.5 s**, LCP **1.5 s**, Speed Index **1.6 s**, TBT **0 ms**, CLS **0.006**.
- Budgets: initial JS **2.33 kB**, CSS **12.69 kB + 47 B**, self-hosted font **54.35 kB**, mobile AVIF **10.53 kB** / WebP **18.41 kB**, and unpacked extension **43.42 kB**. All are within the stated budgets.

## Privacy, network, and response policy

- Initial desktop and mobile live sessions made same-origin requests only; no analytics, advertising, CDN font/script, cookie, or article-text request was observed. Source review confirms anchors/settings use `browser.storage.local`; the only optional cross-origin calls are Sociobot checkout/verify for the stated Plus license path.
- Live HTML, CSS/font assets, privacy, terms, service worker, and ZIP responses supplied HSTS, CSP, Permissions-Policy, strict referrer policy, `nosniff`, and frame denial. HTML revalidates; hashed assets and fonts are one-year immutable; `/sw.js` is `no-cache`.
- Live `/` SHA-256 is `cc529246c2cd8ba57db13c4a47c6b9e776c97e2d31076814c4a9112d8aa00126`, exactly matching the candidate build. `/sw.js` also matches exactly. The live ZIP's outer SHA differs because ZIP entry timestamps differ, but all 19 unzipped payload hashes (including `manifest.json`, content script, popup/options chunks, and icons) exactly match the candidate package.

## Defects by severity

### Critical / High / Moderate

None.

### Low — AVIF response MIME type

`/images/reading-coordinate-800.avif` is served as `application/octet-stream` rather than `image/avif`. Chromium nevertheless selected and decoded the AVIF (`currentSrc` was the AVIF URL, HTTP 200) in both desktop and 390px checks, so this is not a release blocker. Add an `.avif: image/avif` MIME mapping to static hosting configuration in a future maintenance change.

### Advisory — development dependency audit

The full `npm audit` reports 12 development-tool vulnerabilities. The production-only audit is clean and no audited dependency is shipped to users. Update the development stack on a routine maintenance cycle.

## Retest commands

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev
```

