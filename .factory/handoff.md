# Save and return to an exact web sentence — verification 5 handoff

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-verify-5`
- Verdict: **FAIL**
- Finding count: **3**
- Untested claim count: **1**
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Implementation reviewed: `4e18c7f304c3701e6478911587eefab03a98d27c`
- Documentation base: `511be00d4249f0f3b3ca5c4e71a92e9b370e7c0c`
- Full report: [.factory/verification-5.md](verification-5.md)

## Outcome

The free reader completes its core job and all 23 declared claim commands pass from a clean clone. The live site and 15-file extension ZIP match the implementation candidate. The product is still **FAIL** because acceptance requires zero findings and zero untested claims.

Three findings remain:

1. The public Plus checkout returns HTTP 404. The designated price test checks copy only, so the live paid offer is one untested claim.
2. Repeated website and extension links have touch areas below 44 × 44 CSS pixels.
3. **Start for real** leaves `demo:reading-resume:sample` in localStorage instead of discarding the demo record.

The missing checkout registration was already documented as an external dependency. It is now a verification finding because the live page presents an active purchase action that returns an unexpected 404.

## Verification completed

- Fresh clone at documentation SHA `511be00`; later commits after implementation `4e18c7f` are report-only.
- `npm run check`: TypeScript, 10 Vitest tests, and production build passed.
- `npm run test:e2e`: 49 passed, 13 expected mobile skips.
- `npm run test:claims`: 33 passed, 13 expected mobile skips.
- Every one of the 23 manifest commands passed separately.
- Production dependency audit: zero vulnerabilities.
- Live Lighthouse: 100 Performance, Accessibility, Best Practices, and SEO; LCP 1.1 s and CLS 0.
- Fresh desktop, 390 px phone, keyboard, focus, reduced-motion, Axe, privacy, offline, metadata, legal, link, header, deliberate-404, and ZIP checks completed.
- Live `/`, `/demo/`, `/privacy/`, `/terms/`, the 404 body, and `/sw.js` byte-match the clean build. All 15 extracted ZIP payloads match.

## Passing core behavior

The sample has realistic populated output and a persistent demo label. Save, reload, resume, reset, malformed-state recovery, no-saved recovery, and first/last sentence boundaries work. A seeded real-data key remains unchanged. The installed MV3 package saves the selected occurrence, handles duplicate sentences and changed pages, moves the reading strip, reads aloud, stores locally, exports and clears, and works offline on an already loaded article.

All previously reported implementation defects remain fixed except where the verification report identifies the new demo-exit cleanup gap. The deliberate product-site HTTP 404 is expected and correctly designed; the external checkout 404 is not.

## How to reproduce

```sh
npm ci
npm run check
npm run test:e2e
npm run test:claims
npm audit --omit=dev
```

Run each `test` value in `.factory/claims.json` separately. For live checks, open `/` and `/demo/` in fresh desktop and 390 × 844 contexts. The exact reproduction steps and measurements are in `.factory/verification-5.md`.

## Required next work

- Register the Plus offer or remove the purchase action until checkout exists, then add an outcome-based checkout claim.
- Increase all website and extension interactive target areas to at least 44 × 44 CSS pixels.
- Clear the demo storage key when **Start for real** is selected and cover that outcome in `demo-isolation`.

No product code, infrastructure, billing configuration, or secrets were changed by this verification. The repository remains buildable.
