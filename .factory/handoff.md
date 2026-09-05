# Reading Resume — repair 4 handoff

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-repair-4`
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Implementation commit: `4e18c7f304c3701e6478911587eefab03a98d27c`
- Documentation commit: recorded in the follow-up metadata commit after this handoff
- Deployment: Static Web App `sf-dyslexia-reading-resume`; existing production app reused; upload succeeded
- Product verdict: **PASS** for the shipped site, extension, and all 23 public claims

## Job, audience, and first action

The job is to save one exact sentence in a web article and return to it after an interruption. The audience is dyslexic web readers who lose their place in difficult reading. The first action is **Try it with sample data**. It opens `/demo/` with a saved sentence already visible.

## What changed

The product behavior and public copy remain unchanged. The incomplete claims contract found in review 2 is now complete:

- `article-text-private` runs the packaged extension on a normal article. It saves, resumes, and starts read aloud while proving those actions add no network requests and send no article sentence.
- `local-browser-storage` saves a normal, non-demo anchor and changed reading settings. It verifies both records in local extension storage and confirms no demo namespace is used.
- `no-tracking` now visits every public site route, records the full runtime request set through a demo save, and verifies that the site sets no cookies or third-party requests.
- `plus-presets` uses a recorded valid-license response. It exposes exactly three presets, applies each one, checks every persisted setting, reloads, and confirms the last preset remains selected.
- `offline-extension` takes a clean packaged extension offline on an already loaded article. Saving, resuming, moving, read aloud, and extension settings remain usable.
- `read-aloud` now captures the utterance sent to the browser speech API and compares it with the sentence visible in the sample.
- `free-core` starts with empty storage and no license. It performs save, resume, read aloud, reading-setting changes, and a real export, then confirms that no license appeared.

`.factory/claims.json` now has 23 entries. Every ID appears on exactly one outcome-based browser test. The valid-license fixture is test-only and explicitly not a credential.

## Review 2 finding disposition

| Untested public statement | Current evidence |
| --- | --- |
| Article text is not sent to Reading Resume | `article-text-private` records the packaged extension’s requests across save, resume, and read aloud. No request is added by those actions. |
| Normal anchors and settings stay in browser storage | `local-browser-storage` verifies a normal `anchor:` record and `readingSettings` in `chrome.storage.local`. |
| Website has no analytics, trackers, cookies, or third-party runtime scripts | `no-tracking` covers `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html`, then checks all request origins and cookies. |
| Plus adds three saved presets | `plus-presets` verifies all three preset names, mappings, persistence, and reload behavior through a recorded license response. |
| Free reader remains available offline | `offline-extension` exercises the installed package after the browser context goes offline. |
| Read aloud starts with the visible sentence | `read-aloud` compares the captured speech utterance with the current visible sample sentence. |
| Save, return, read aloud, controls, and export stay free | `free-core` performs all five outcomes in a clean profile with no license record. |

All earlier findings remain resolved: selected-sentence and duplicate-occurrence restoration, installable ZIP delivery, clean setup, cache versioning, 390 px overflow, blank-license recovery, isolated demo data, metadata, legal routes, the designed 404 response, AVIF MIME, security headers, and historical evidence correction.

## Clean-checkout verification

A separate clone of implementation commit `4e18c7f304c3701e6478911587eefab03a98d27c` was installed with only `npm ci`.

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev --json
```

Results:

- TypeScript passed.
- Vitest: 10 passed.
- Production build passed and produced `dist/site/`, the unpacked MV3 extension, and the install ZIP.
- Playwright: 49 passed and 13 expected mobile skips across 62 project cases.
- Every one of the 23 exact commands in `.factory/claims.json` passed separately from that clone.
- The aggregate `npm run test:claims` run passed: 33 passed and 13 expected mobile skips.
- Production dependency audit: zero vulnerabilities. The unrestricted development audit still reports 12 toolchain advisories.

Build sizes remain inside the product budgets: initial JavaScript 6.09 kB, CSS 14.75 kB, local font 54.35 kB, mobile AVIF 10.53 kB, social image 67.15 kB, and unpacked extension 43.99 kB.

## Live verification after deployment

- The factory `verify-url.sh` check passed with HTTP 200, correct title and language, one H1, a main landmark, complete image alt attributes, named buttons, and no console errors.
- Fresh desktop and 390 × 844 phone contexts show the job, audience, and sample action before scrolling. Both have no horizontal overflow.
- The demo starts with a realistic five-sentence station note and the persistent **Demo — sample data, nothing is saved** label. Saving sentence 5, reloading, choosing sentence 1, and resuming returns sentence 5. Reset restores sentence 3. A seeded real-data key remains unchanged.
- The demo reloads offline after service-worker control is established.
- Fresh Axe scans on `/`, `/demo/`, `/privacy/`, `/terms/`, and the not-found page report zero serious or critical findings.
- The first Tab focuses the visible skip link with a 3 px teal outline; Enter moves to `#main`. Reduced motion changes animation and transition duration to `0.01ms` and uses automatic scrolling.
- `/does-not-exist` deliberately returns HTTP 404 with the designed title, one H1, main landmark, and a route back. The 404 is expected.
- Live HTML and service-worker SHA-256 values match the local deployment artifact. The live ZIP returns `application/zip`; its 15 files match the local packaged extension byte-for-byte. AVIF returns `image/avif`.
- CSP, HSTS, `nosniff`, strict referrer policy, frame denial, and Permissions-Policy are present.
- Live Lighthouse on `/demo/`: Performance 100, Accessibility 100, FCP 0.9 s, LCP 1.1 s, TBT 10 ms, CLS 0.

## Billing status

Reading Resume Plus remains a $12 one-time purchase for three reading-strip presets. The free reader remains fully usable. The owned checkout endpoint currently returns HTTP 404 because the product is not yet enabled in the billing service. This is an external registration dependency, not a local product failure. Exact public offer metadata is in `/work/.evidence/billing-offer.json` for the separate billing operator. No paid feature was removed or made free.

## Evidence

- `/work/.evidence/repair-4-live-browser.json`
- `/work/.evidence/repair-4-live-desktop.png`
- `/work/.evidence/repair-4-live-phone.png`
- `/work/.evidence/repair-4-lighthouse.json`
- `/work/.evidence/verify.json`
- `/work/.evidence/catalog-description.txt`
- `/work/.evidence/billing-offer.json`

## Known gaps and next steps

- The billing operator must enable `dyslexia-reading-resume` before the hosted checkout link can sell Plus.
- Browser-store submission remains external. The downloadable MV3 ZIP is ready for installation now.
- The 12 development-only dependency advisories remain. The shipped static product has zero production dependency findings.

This product has no backend, shared database, tenant, health endpoint, or server-side rate-limit claim. All product state remains in browser storage.
