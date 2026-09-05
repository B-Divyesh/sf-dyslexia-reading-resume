# Save and return to an exact web sentence — verification 5 FAIL

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-verify-5`
- Verdict: **FAIL**
- Finding count: **3**
- Untested claim count: **1**
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Implementation candidate: `4e18c7f304c3701e6478911587eefab03a98d27c`
- Documentation revision reviewed: `511be00d4249f0f3b3ca5c4e71a92e9b370e7c0c`

## Job, audience, and first action

The job is to save one exact sentence in a web article and return after an interruption. The audience is dyslexic web readers who lose their place in difficult reading. The first action is **Try it with sample data**.

Fresh desktop and 390 × 844 phone browsers showed the job, audience, action, and three plain facts before scrolling.

## Verdict

**FAIL.** The free reader completes its core job, all 23 declared claim commands pass, and the live files match the implementation candidate. Acceptance still requires zero findings and zero untested claims. The live paid checkout is broken and its outcome is not covered by the designated claim test. Touch targets are below the required size, and leaving the demo does not discard its sample record.

## Findings

### Moderate — the public Plus checkout returns an unexpected 404 and the paid offer is not outcome-tested

The landing page links **Buy Plus at Sociobot checkout** to:

`https://api.sociobot.in/api/v1/products/dyslexia-reading-resume/checkout`

A fresh request returned HTTP **404** with `application/json`. This is not the deliberate product-site 404. It is a broken purchase path. The landing page, demo, README, privacy page, and terms present Plus as a current $12 one-time offer, and the terms say Sociobot / Dodo handles payment and refunds.

The designated `@claim:plus-price` test only checks that the sentence “Optional reading-strip presets cost $12 once. No subscription.” is visible. It does not open checkout or prove that the $12 offer can be purchased. `@claim:plus-presets` uses a recorded valid-license response and proves the three presets, but it does not cover checkout. The public paid-offer outcome therefore counts as **one untested claim** even though all declared commands pass.

The prior handoff identifies missing billing registration as an external dependency. That explains the response but does not make a public purchase link returning 404 an expected user path. Register the product and verify a hosted-checkout response, or remove the current purchase action and describe Plus as unavailable until registration is complete.

### Moderate — website and extension touch targets are smaller than 44 px

The 390 px live site contains repeated interactive areas below the required 44 × 44 CSS-pixel minimum:

- Home wordmark: 156 × 38.
- Demo **Start for real**: 86 × 20.
- Footer Demo: 37 × 17; Privacy: 43 × 17; Terms: 39 × 17.
- Not-found **Go to the home page**: 148 × 20.

Desktop header links are also about 17 px high. In the installed MV3 artifact, the popup skip link measured 113 × 34. The settings wordmark measured 168 × 36, and its Privacy and Terms links measured 47 × 15 and 38 × 15.

The controls remain keyboard reachable and have visible focus. Axe reports no serious or critical rule violations, but automated Axe checks do not replace the explicit 44 px touch-target requirement. Increase the clickable padding or minimum block size without enlarging only the text.

### Low — Start for real leaves the demo record behind

In a fresh phone context, I selected and saved sentence 5, then chose **Start for real**. The browser returned to `/`, but `demo:reading-resume:sample` remained in localStorage as `{"currentIndex":4,"savedIndex":4}`.

The demo still uses a separate namespace, and a seeded non-demo value remained unchanged. The isolation claim therefore passes. However, the demo contract requires leaving demo mode to discard demo data or offer an explicit keep action. Remove the demo key when **Start for real** is chosen and add that outcome to `@claim:demo-isolation`.

## Claim command results

The repository was cloned from `main` into `/tmp/reading-resume-verify5.BjI8WC`. Its checkout SHA was `511be00d4249f0f3b3ca5c4e71a92e9b370e7c0c`; the only commits after implementation `4e18c7f` change `.factory/handoff.md`. After `npm ci`, every exact command in `.factory/claims.json` ran separately.

| Claim ID | Result | Observed outcome |
| --- | --- | --- |
| `demo-isolation` | Pass | Separate demo key; seeded real key unchanged; reset works. |
| `sample-controls` | Pass | Save, reload, and resume returned sentence 5. |
| `read-aloud` | Pass | Captured utterance matched the visible sentence. |
| `offline-demo` | Pass | A separately controlled context reloaded the demo offline. |
| `no-tracking` | Pass | Public routes and demo flow used one origin and no cookies. |
| `plus-price` | Command passes; coverage incomplete | Test checks copy only; live checkout is not exercised. |
| `plus-presets` | Pass | Recorded valid response exposed and persisted all three presets. |
| `free-core` | Pass | Clean unlicensed package completed save, resume, speech, settings, and export. |
| `extension-download` | Pass | Download response is a ZIP. |
| `license-recovery` | Pass | Blank restore explains the required token and returns focus. |
| `route-metadata` | Pass | All built routes have distinct titles and sharing metadata. |
| `not-found` | Pass | Designed not-found page has a route back. |
| `mobile-layout` | Pass | Demo width is 390 px with no horizontal overflow. |
| `exact-sentence` | Pass | Packaged extension saved the selected sentence. |
| `resume-after-reload` | Pass | Packaged extension restored the saved sentence after reload. |
| `duplicate-sentence` | Pass | The selected repeated occurrence was restored. |
| `changed-page-recovery` | Pass | A changed page asks for a new saved place. |
| `reading-strip` | Pass | The installed strip moved to a different sentence. |
| `local-anchor-storage` | Pass | Demo anchor used only the demo extension namespace. |
| `local-browser-storage` | Pass | Normal anchor and settings persisted in extension storage. |
| `article-text-private` | Pass | Save, resume, and speech added no network request or article text. |
| `offline-extension` | Pass | Loaded article and extension settings remained usable offline. |
| `export-clear` | Pass | Demo export contained the anchor, and clear removed it. |

The result is 23 command passes and one incomplete public-claim outcome. The untested claim count is therefore 1.

## Clean-checkout quality gates

```text
npm ci                         passed
npm run check                  passed: TypeScript, 10 Vitest tests, production build
npm run test:e2e               passed: 49 passed, 13 expected mobile skips
npm run test:claims            passed: 33 passed, 13 expected mobile skips
npm audit --omit=dev --json    passed: 0 production vulnerabilities
```

The unrestricted install audit still reports 12 development-tool advisories: 2 moderate, 6 high, and 4 critical. They are not part of the shipped static payload. The production build produced `dist/site/`, the unpacked MV3 extension, and the install ZIP. Initial JavaScript is 6.09 kB, CSS is 14.75 kB, the local font is 54.35 kB, the mobile AVIF is 10.53 kB, and the unpacked extension is 43.99 kB.

Fresh Lighthouse 13.4.1 against live `/demo/` scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100. FCP was 0.8 s, LCP 1.1 s, TBT 0 ms, and CLS 0.

## Live browser and installed-artifact evidence

- Desktop and phone first screens show the H1 **Save your place in a web article**, the dyslexic-reader audience sentence, the sample action, and the free/local-price facts before scrolling. Both widths have no horizontal overflow.
- The sample starts with five realistic station-note sentences and the persistent **Demo — sample data, nothing is saved** label. Saving sentence 5, reloading, choosing sentence 1, and resuming returns sentence 5. Reset restores sentence 3.
- Malformed demo storage recovers to the built-in sample. Previous is disabled at sentence 1, Next is disabled at sentence 5, and Resume without a saved sentence explains what to do.
- A seeded real-data key stayed unchanged through save, reload, resume, and reset. The only sample record is `demo:reading-resume:sample`.
- Blank license restore announces “Enter the license token from your receipt.”, sets `aria-invalid`, and returns focus. A non-blank invalid token receives HTTP 200 from verify and reports that the license is inactive.
- The first Tab reaches the skip link. Its live focus outline is 3 px teal, and Enter moves to `#main`. Reduced motion limits animation and transition durations to 0.01 ms and uses automatic scrolling.
- Axe found zero serious or critical issues on `/`, `/demo/`, `/privacy/`, `/terms/`, the live HTTP 404 page, popup, and settings. Titles, `lang`, one H1, main/header/nav/footer landmarks, image alt attributes, labels, and route metadata are present.
- The demo becomes service-worker controlled and reloads offline with its title, H1, and demo banner intact.
- The website flow makes same-origin requests only and sets no cookies. The issue-tracker privacy contact returns HTTP 200.
- `/does-not-exist` deliberately returns HTTP 404 with the designed Reading Resume page and routes back. That response is expected and is not a defect.
- All other product links return HTTP 200. The install ZIP is `application/zip`; AVIF is `image/avif`; `robots.txt`, `sitemap.xml`, icons, social image, privacy, and terms are present.
- CSP, HSTS, `nosniff`, strict referrer policy, frame denial, Permissions-Policy, service-worker `no-cache`, and immutable hashed-asset caching are live.

## Candidate and live identity

The live response bytes match the clean build for `/`, `/demo/`, `/privacy/`, `/terms/`, the designed 404 body, and `/sw.js`. The live and candidate extension archives each contain 15 files, and every extracted payload file matches byte-for-byte.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Selected text saved as the first sentence | Fixed; `exact-sentence` passes in the installed package. |
| Duplicate text returned to the first occurrence | Fixed; `duplicate-sentence` passes. |
| Live download returned HTML or mismatched the candidate | Fixed; live ZIP is valid and all 15 payloads match. |
| Clean tests required a prior build | Fixed; clean `npm run check` passes after `npm ci`. |
| 390 px horizontal overflow | Fixed; live phone width is exactly 390 px. |
| Blank license recovery was missing or wrong | Fixed on the website and extension. |
| Cache/update and hardening policies were missing | Fixed; service worker, cache policy, and headers pass. |
| No one-click isolated demo | Core flow fixed; isolation and reset pass. **Exit cleanup remains open in this report.** |
| Claims manifest absent or seven outcomes incomplete | The seven review-2 gaps are fixed. **Paid checkout availability remains untested and broken live.** |
| Plain-words first screen missing | Fixed on desktop and phone. |
| Route metadata, consistent footer, and real 404 missing | Fixed and live. |
| AVIF served with the wrong MIME type | Fixed; live type is `image/avif`. |
| Prior PASS evidence misstated overflow and ZIP count | Corrected in verification 3; current measurements use 390 px and 15 files. |
| Development dependency audit | Still 12 development-only advisories; production audit is zero. |

## Scope

This is a static browser-extension product. It has no backend tenant, product database, health endpoint, restart-persistence path, or server rate-limit promise. The installed consumer artifact was exercised in clean persistent Chromium profiles. No product code, infrastructure, billing configuration, or secrets were changed during verification.

## Required next work

1. Register the Plus offer so checkout returns the hosted purchase flow, or remove the live purchase action until it is available. Add an outcome-based checkout claim test.
2. Give website and extension links at least 44 × 44 CSS-pixel clickable areas, then verify desktop, phone, popup, and settings.
3. Remove `demo:reading-resume:sample` when **Start for real** is chosen and extend the isolation claim test.

The unambiguous product verdict is **FAIL** with 3 findings and 1 untested claim.
