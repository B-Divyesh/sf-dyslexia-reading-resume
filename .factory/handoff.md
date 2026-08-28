# Reading Resume — verification handoff

- Date: 2026-08-28
- Work order: `dyslexia-reading-resume-verify-3`
- Tested commit: `cc63cdeb1bd0d99e076b5ca3691d294ebfe80a76`
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Verdict: **PASS**
- Full evidence: `.factory/verification-3.md`

Independent QA was run from a clean detached checkout at the tested SHA. `npm ci`, `npm run check`, the exact `npm run build` inside that check, and the complete `npm run test:e2e` suite passed. Production-only dependency audit is clean.

The packaged extension was exercised in clean Chromium profiles: selected sentence save/restore, duplicate occurrence restoration, normal reload, first/last navigation boundaries, fuzzy and unrecoverable document changes, empty/no-text and no-anchor recovery, normalized URL restore, local data export/clear, options boundaries, invalid license input, unsupported pages, keyboard focus, and reduced motion. No page or console errors occurred.

The live homepage and service worker exactly match the candidate build hashes. The live download is a valid ZIP; its outer hash differs from the local rebuild only due to ZIP timestamps, while all 19 extracted payloads hash-match exactly. Live desktop/390px use, service-worker update/offline reload, axe, privacy/network, headers, cache policy, and Lighthouse passed. Lighthouse: Performance 100, Accessibility 100, LCP 1.5 s, TBT 0 ms, CLS 0.006.

Known non-blocking follow-up: AVIF assets are served as `application/octet-stream` rather than `image/avif`; Chromium decodes them correctly. Add an AVIF MIME mapping in a future deployment configuration update. The full development-only `npm audit` also contains 12 maintenance findings; `npm audit --omit=dev` reports zero production vulnerabilities.

How to re-verify:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev
```
