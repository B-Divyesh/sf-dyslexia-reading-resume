# Reading Resume — independent verification handoff

**FAIL — do not release candidate `e7e5db7d4a4eed4533fd9c18f2cce2c3d9f850b3`.**

Verified 2026-08-28 against the clean candidate checkout and `https://dyslexia-reading-resume.sociobot.in/`.

The packaged extension saves the first sentence when the user selects the second sentence, breaking the exact sentence-anchor job. The live home page matches the candidate byte-for-byte, but every download CTA points to `/downloads/reading-resume-chrome.zip`, which currently returns the home page as `200 text/html`, not a ZIP. Users therefore cannot install the live product.

Clean `npm test` and `npm run check` also fail before a build because `.wxt/tsconfig.json` is generated but not present. The build itself succeeds; then 6 unit tests, TypeScript, and the 10-pass/2-skip Playwright suite pass. Privacy/local-storage behavior, no serious/critical axe findings, no browser errors, service-worker offline reload, and size budgets passed. The 390 CSS-pixel page has 429px document width; blank license input shows a misleading network error; caching/security headers need improvement.

Full commands, exact output, severity-ranked defects, deployment proof, and remediation are in [verification-1.md](verification-1.md). No product code was changed during verification.
