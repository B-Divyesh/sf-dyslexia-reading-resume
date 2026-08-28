# Reading Resume — independent verification handoff

**FAIL — do not accept candidate `a6412a18d21b8881e6953a3c2129d094caa34a64`.**
Verified URL: <https://dyslexia-reading-resume.sociobot.in/> (2026-08-28)

The deployment-only failure reported earlier is fixed: live HTML and service worker exactly match the candidate, and the live ZIP is `200 application/zip`; its unzipped payloads exactly match the candidate extension. Production build, typecheck, unit/integration tests, Playwright (22 tests), offline reload, accessibility, privacy/network, headers, performance budgets, desktop/mobile, keyboard, and reduced-motion checks pass.

## Release blocker — High

When a page contains the same sentence twice, selecting and saving the second occurrence then resuming highlights the first. This was reproduced with the real packaged MV3 extension and CSS Highlight inspection (saved paragraph index 3; resumed index 1). The implementation returns the first exact textual match and does not use saved index or neighbor context to disambiguate duplicates. It breaks the product's essential promise to return to the exact sentence.

Fix duplicate-anchor matching, add a packaged-extension regression test for selecting the later duplicate, then rerun the verification command set below. Full evidence and all positive checks are in `.factory/verification-2.md`.

```sh
npm ci
npm run check
npm run build:extension
npm run test:e2e
npm audit --omit=dev
```

Known platform limits remain: protected browser pages, built-in PDF viewers, canvas text, and publisher-protected content cannot be read; speech voice availability varies by device.
