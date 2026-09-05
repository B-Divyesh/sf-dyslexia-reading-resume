# Resume at the exact sentence — review 1

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-review-1`
- Verdict: **FAIL**
- Finding count: **8**
- Untested claim count: **16**
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Implementation candidate reviewed: `d1300a2032325408c716da2b7a071fe99eb2f497` (`fix: resume exact duplicate sentence occurrence`)
- Documentation SHAs after the implementation: `cc63cdeb1bd0d99e076b5ca3691d294ebfe80a76` and `2e4b3e62f8eb84bd7501a38f2573cef1c2edf037`

## Job, audience, and first action

The job is to save a difficult web passage at the exact sentence and return to it later, with optional device read-aloud. The audience is dyslexic web readers who lose their place after an interruption. The required first action is **“Try it with sample data”**, so a visitor can safely see that flow before installing or using real data.

In fresh desktop and 390 px browser contexts, the actual first screen instead has the H1 **“Stop reading. Not your progress.”** and a **“Download for Chrome”** action. It has no sample action. The headline does not name the job or the audience.

## Findings

### Critical — no one-click, isolated sample sandbox

There is no visible “Try it with sample data” action, no `/demo` implementation, no `?demo=1` mode, no persistent sample-data label, no Reset demo control, no Start for real control, and no separate demo storage namespace. `.factory/demo.md` is also absent.

Fresh live checks of both `/demo` and `/?demo=1` returned the normal home page (HTTP 200, normal title and H1), with zero demo banners and zero reset/start-for-real controls. The page therefore cannot demonstrate saving, restoring, or read-aloud without installation and without touching real extension storage. This fails the demo-sandbox contract and leaves the requested sample/reset/no-real-data exercise impossible.

### High — claims contract is absent; 16 public claims are untested

`.factory/claims.json` is missing. There are consequently no declared claim commands or `@claim:<id>` tests to run from the demo entry point. Existing unit and end-to-end tests are useful regression tests, but they are not the required observable claim tests in a sandbox.

The following 16 visitor-reliant claims are untested under the claims contract: exact sentence saving; restore after navigation/reload; selected-or-viewport sentence selection; conservative changed-page recovery; reading-strip navigation/settings; device read-aloud; local anchor storage; no article-text API; export; clear; keyboard shortcuts; no account/tracking; $12 one-time Plus price; free core/accessibility/export; offline free reader; and installation/download usability. The same claims appear across the landing page, README, privacy page, and terms. The count in this report and the evidence JSON is therefore 16, not zero.

### Moderate — first screen and page copy fail the plain-words contract

The headline is metaphorical rather than the job in the reader’s words, and the accompanying sentence names neither dyslexic readers nor their interruption situation. Its primary action is download rather than the required safe sample. Decorative or mood copy also appears throughout, including “A sentence is a place,” “Built around the moment that usually gets lost,” “Mark → orient → continue,” “Your place survives the interruption,” and “Keep the thread.” These do not name a task, section, or next action in plain words.

The three first-screen facts also omit the displayed $12 one-time price. There is no `.factory/copy-audit.md` required by the plain-words contract.

### Moderate — the live 390 px page has horizontal overflow

In a fresh 390 × 844 CSS-pixel context, `document.documentElement.scrollWidth` was **429** while `innerWidth` was **390**. The overflowing elements were `.hero-art`, its `picture`, and its `img`. The mobile rule in `site.css` sets `.hero-art { width: 110% }`.

`site/src/repair.css` attempts to restore `width: 100%`, and its 47-byte built asset is served live, but it is linked before the main stylesheet. The later `site.css` rule wins, so the repair does not work. `body { overflow-x: hidden }` only hides the excess; it does not fix the layout. The test suite misses this because its `isMobile: true` configuration reports a 429 px layout viewport and compares the width to itself.

### Moderate — blank website license restoration gives no recovery feedback

On the live landing page, choosing “Have a license? Restore it” and submitting the blank token leaves `#license-status` empty. The form has no `required` constraint and its submit handler silently does nothing when the input is empty. A buyer is given no explanation or next step.

The extension options page correctly says “Enter the license token from your receipt.” The website restore path needs the same invalid-input recovery message and an announced error.

### Moderate — required metadata and a real 404 page are missing

The landing page has a title, language, one H1, main landmark, description, and favicon. However, all three public pages lack canonical URLs, Open Graph metadata, Twitter-card metadata, and an Apple touch icon. `/privacy/` and `/terms/` also lack meta descriptions. The footer is not consistent across routes and does not include the required “Built by Param Factory” or a version/build identifier.

There is no designed 404 route. A direct request to `/does-not-exist` returns HTTP 200 and the ordinary landing page. That is navigation fallback, not a real 404 page with a way back, and it conceals bad URLs.

### Low — AVIF files use the wrong MIME type

`/images/reading-coordinate-800.avif` returns `Content-Type: application/octet-stream`, not `image/avif`. Chromium currently decodes it, but the server configuration should map `.avif` to `image/avif`. This remains open from verification 3.

### Low — prior PASS documentation contains false current evidence

`.factory/verification-3.md` and the prior handoff say the 390 px check had no horizontal overflow. The fresh live measurement above disproves that statement. They also state that 19 ZIP payloads hash-matched; the current candidate and live archive each contain 15 file entries, although those 15 payloads do match exactly. The report record must be corrected rather than retained as PASS evidence.

## What passed

### Clean setup and declared commands

A fresh clone at `2e4b3e62f8eb84bd7501a38f2573cef1c2edf037` was used. `npm ci` passed. The following commands all passed:

```sh
npm test                 # Vitest: 10 passed
npm run build:extension  # MV3 package: 43.42 kB
npm run build            # static site and install ZIP
npm run check            # type check, 10 tests, production build
npm run test:e2e         # 20 passed, 4 expected project skips
npm audit --omit=dev     # 0 production vulnerabilities
```

There were no declared claim commands to execute because the required manifest is absent. A direct `npx @axe-core/cli` attempt could not start its Selenium Chrome in this container, even when given the Playwright Chromium path. The repository’s pinned Playwright Axe integration was run by `npm run test:e2e`, and a fresh live Playwright/Axe scan found zero serious or critical violations on `/`, `/privacy/`, and `/terms/`.

### Extension and package

The locally built MV3 extension was exercised in a clean persistent Chromium profile. It returned the expected no-anchor, changed-page, and no-readable-text recovery messages; saved and restored a sentence; stayed usable at first/last navigation boundaries; and produced no console or page errors. The full end-to-end suite also verified a specifically selected shared-text sentence and the later occurrence of an exact duplicate sentence.

The live download is HTTP 200 `application/zip`, contains `manifest.json` at its root, and its 15 extracted payloads match the locally built candidate byte-for-byte. The outer ZIP hashes differ only because archive timestamps differ.

### Live quality checks

Fresh desktop and phone visits had no console or page errors and requested only the product origin on first load. The live shell worked after service-worker activation and an offline reload. Keyboard Tab reached the visible skip link and Enter moved to `#main`. Reduced-motion was active and the hero’s transition duration measured `0.01ms`. The live Axe scan had no serious or critical results. Security headers, the service-worker `no-cache` policy, and immutable hashed-asset caching are present.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Selected text saved as the first sentence | Fixed; selected-sentence package regression passes. |
| Live download served HTML | Fixed; live ZIP is installable and payload-matches the candidate. |
| Clean `npm test` / `check` failed before build | Fixed; both pass after clean `npm ci`. |
| Mobile overflow | **Still open**; reproduced above despite the attempted repair. |
| Blank extension license message | Fixed in extension options; website restore has a separate blank-input defect. |
| Cache/update versioning and response policies | Fixed; release-versioned service worker, cache policy, CSP, frame denial, referrer and permissions policies observed. |
| Duplicate sentence returned to first occurrence | Fixed; the packaged duplicate-occurrence regression passes. |
| AVIF MIME type | **Still open**; low severity. |
| Development dependency audit | Still 12 development-tool findings; production-only audit remains zero. Advisory, not a shipped-runtime vulnerability. |

## Required next work

1. Build a real `/demo` or `?demo=1` flow with realistic sample article text, isolated `demo:` storage, persistent label, Reset demo, Start for real, and `.factory/demo.md`.
2. Add `.factory/claims.json`, tag and run one observable sandbox test per public claim, then remove or test every remaining claim-like sentence.
3. Rewrite the first screen in plain words: name sentence-level resume for dyslexic web readers, show the sample action first, and list price/privacy/offline facts. Add the required copy audit.
4. Fix the mobile hero cascade and test at an actual 390 CSS-pixel layout viewport.
5. Give blank website license restore a labeled, announced recovery error.
6. Add route metadata, consistent footer/build information, a designed HTTP 404 page, and the AVIF MIME mapping; correct the prior verification count/evidence.

This review is **FAIL**. It must not be reported as PASS until every finding and every untested claim is resolved.
