# Reading Resume — repair handoff

- Date: 2026-08-28
- Work order: `dyslexia-reading-resume-repair-2`
- Verifier report: `9416067dcebb9d317fac985e89f3c8297e3de9ed`
- Rejected candidate: `a6412a18d21b8881e6953a3c2129d094caa34a64`
- Repair commit: `d1300a2`

## Repaired

The verifier's duplicate-sentence failure was reproduced before the fix in both layers:

- Unit regression: the matcher returned paragraph index 1 instead of the saved duplicate at index 3.
- Fresh packaged MV3 regression: selecting paragraph 3, sending the real `SAVE_PLACE`, then the real `RESUME_PLACE` moved the `reading-resume-current` CSS Highlight to paragraph 1.

`bestSentenceIndex()` now gathers all exact normalized-text matches instead of returning the first. When exact text occurs more than once, it compares the persisted previous/next sentence context; if context is tied or unavailable, it chooses the occurrence nearest the persisted `sentenceIndex`. `locateAnchor()` now supplies the stored `prefix` and `suffix`. Unique exact matches and the existing conservative fuzzy fallback are unchanged.

## Exact regression coverage

- `tests/sentences.test.ts` proves neighboring context beats a stale index and the saved index disambiguates duplicates when context cannot.
- `tests/e2e/extension.spec.ts` loads the built MV3 extension into a clean persistent Chromium profile, selects the second of two identical sentences at paragraph index 3, invokes real save and resume messages, and asserts the CSS Highlight remains at index 3 after both actions.

## Verification evidence

Clean dependency installation used `npm ci` with Playwright pinned at `1.58.2`.

```sh
npm run check
npm run build:extension
npm run test:e2e
npm audit --omit=dev
```

- `npm run check`: passed TypeScript, 10/10 Vitest unit/integration/policy tests, and the production build.
- `npm run build:extension`: passed; unpacked MV3 package is 43.42 kB.
- `npm run test:e2e`: 20 passed, 4 expected mobile-project skips out of 24 cases. Coverage includes the packaged extension, the duplicate occurrence, desktop, 390px mobile, keyboard, axe on `/`, `/privacy/`, `/terms/` plus popup/options, ZIP consumer response, offline reload, and release-versioned service-worker updates.
- Accessibility: zero serious/critical axe findings. First Tab reaches the skip link with a 3 px turquoise outline; Enter reaches `#main`; Space operates the read-aloud example. Reduced-motion reports no animation and 0.01 ms transition/animation durations.
- Privacy: live initial loads contacted only `dyslexia-reading-resume.sociobot.in`; no analytics, cookies, CDN scripts/fonts, or article-text transmission were observed. Anchors/settings remain in `browser.storage.local`; only optional license checkout/verification uses the declared Sociobot API.
- `npm audit --omit=dev`: 0 production vulnerabilities. A clean install reports 12 development-tool findings (2 moderate, 6 high, 4 critical); none are included in the shipped static site or extension.
- Mobile Lighthouse 13.4.1: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.5 s, CLS 0, TBT 0 ms, Speed Index 0.9 s.
- Budgets: initial site JS 2.33 kB; CSS 12.69 kB + 47 B; font 54.35 kB; 800px hero AVIF 10.53 kB / WebP 18.41 kB; extension 43.42 kB.

## Deployment and live identity

Deployed the static root `dist/site/` with:

```sh
/opt/fleet/lib/deploy-static.sh dyslexia-reading-resume dist/site
```

Azure Static Web Apps deployment `278ed522-bae8-4908-a322-88b2ade1823f` succeeded and <https://dyslexia-reading-resume.sociobot.in/> reports custom-domain status `Ready`.

- Live `/`: `200`, no browser console/page errors; title, `lang=en`, one H1, main landmark, image alt baseline, desktop, and 390px mobile checks pass. SHA-256 `cc529246c2cd8ba57db13c4a47c6b9e776c97e2d31076814c4a9112d8aa00126`, byte-identical to the local build.
- Live `/sw.js`: SHA-256 `7e3d679b8957bdc9f0f6454dee52c4234e3c743c7b415ede36ee5c96a5d51d44`, byte-identical, served with `Cache-Control: no-cache`.
- Live ZIP: `200 application/zip`, 23,509 bytes, valid archive, SHA-256 `725baee7a3ebc9f445d19e3ee7b9a5a738fe6c9f8b71aacdcb10d4c2dbd75157`, byte-identical to `dist/site/downloads/reading-resume-chrome.zip`.
- Response policy: HTML revalidates; hashed assets use one-year immutable caching; HSTS, self-restricting CSP, strict referrer policy, nosniff, frame denial, and camera/geolocation/microphone/payment/USB denial are active.

## Known limitations and next steps

No release-blocking gap remains from the verifier report. Existing platform limits are unchanged: protected browser pages, built-in PDF viewers, canvas-rendered text, and publisher-protected content cannot be read; device speech voice availability varies. Store publication remains a factory/release operation after browser-store review; the shipped ZIP remains the supported installation artifact in the meantime.
