# Save an exact web sentence — verification 4 PASS

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-verify-4`
- Verdict: **PASS**
- Finding count: **0**
- Untested claim count: **0**
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Implementation candidate: `ce19f6b1173bbdc57f816f4da2506c4df5746582`
- Documentation revision reviewed: `cdc19597c0f7e9977bd06170ff1b85f27ef5f3ba`

## Job, audience, and first action

The job is to save an exact sentence in a web article and return to it after an interruption. The audience is dyslexic web readers resuming difficult reading. The first action is **Try it with sample data**. Fresh desktop and 390 × 844 phone pages showed that action before scrolling, alongside the job, audience, local-storage, free-core, and $12-once facts.

## Verdict

**PASS.** There are no critical, high, moderate, or low findings and no untested public claims. The deployed site matches the last implementation candidate; the later commits are documentation only.

## Clean-checkout verification

A new clone at `cdc1959` was used. It contains the implementation at `ce19f6b` plus later documentation only.

```sh
npm ci                         # passed
npm run check                  # passed: type check, 10 Vitest tests, production build
npm run test:e2e               # passed: 54 browser tests
npm audit --omit=dev --json    # passed: 0 production vulnerabilities
```

Every one of the 19 exact commands in `.factory/claims.json` was then run separately from that clone. All passed, including the six packaged-MV3 demo checks. The final Playwright result was `passed` with no failed tests.

The full development-tool audit still lists 12 advisories. They are development dependencies; the production-only audit is clean. Lighthouse 13.4.1 could not connect to the preinstalled Playwright Chromium in this container, so no new score is claimed from that tool. This is not a product or public-claim failure: the built payload remains within the recorded budgets, and the browser quality checks below passed.

## Live browser evidence

Fresh desktop and phone contexts were used against the live URL.

- Landing title is `Reading Resume — Save your reading place`; the title, one H1, `main`, and `lang="en"` are present. The phone layout has `scrollWidth === clientWidth === 390`.
- `/demo/` shows **Demo — sample data, nothing is saved**, Reset demo, and Start for real. Selecting sentence 5, saving, reloading, selecting sentence 1, and resuming returned sentence 5. Reset restored the supplied sentence-3 state.
- A seeded non-demo localStorage value stayed `unchanged` through the demo flow. The demo used only `demo:reading-resume:sample`; initial demo traffic was same-origin only.
- The normal and invalid paths work: blank license restore says “Enter the license token from your receipt.”, sets `aria-invalid`, and returns focus to the input. The first Tab reaches a visible teal 3 px skip-link focus ring; Enter reaches `#main`. Reduced motion reduces transition and animation duration to `0.01ms`.
- The live service worker controlled `/demo/` after its first visit. An offline reload returned HTTP 200 with title `Demo — Reading Resume` and the expected H1.
- Axe found zero serious or critical violations on `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed not-found page. The intentional `/does-not-exist` HTTP 404 produces its normal browser network error only; its page itself has a title, one H1, `main`, no missing image alt attributes, no overflow, and a way back.
- All same-origin links collected from public routes returned HTTP 200. The two external links are the documented Sociobot checkout and the product issue tracker.

## Deployment and artifact evidence

- Live `/` SHA-256 is `be555df13798c826a417a0a5802b4cd710e635ab8ab1da5e3b0841e4ccfc843e`, exactly matching the clean-candidate build. Live `/sw.js` also byte-matches it.
- Live `reading-resume-chrome.zip` is HTTP 200 `application/zip`; all 15 extracted payload files byte-match the local packaged MV3 artifact.
- Live AVIF is `image/avif`. Public routes have CSP, `X-Content-Type-Options`, strict referrer policy, frame denial, and Permissions-Policy headers. The missing route is the deliberate HTTP 404, not a broken fallback.

## Earlier finding disposition

| Earlier finding | Current evidence |
| --- | --- |
| Selected text saved as the first sentence | Packaged `exact-sentence` claim passes. |
| Duplicate sentence resumed to the first occurrence | Packaged `duplicate-sentence` claim passes. |
| Live ZIP was HTML or did not match | HTTP ZIP and all 15 payloads match the candidate. |
| Clean `npm test` / `check` needed a prior build | Clean `npm run check` passed after only `npm ci`. |
| 390 px horizontal overflow | Live phone width is exactly 390 with no overflow; `mobile-layout` passes. |
| Blank website or extension license recovery | `license-recovery` passes; live blank recovery is announced and focused. |
| Cache/update and hardening headers | Offline reload, service-worker control, versioned worker test, and live headers pass. |
| Missing sample sandbox and claims contract | `/demo/`, isolated namespace, label, reset, documentation, and all 19 manifest commands pass. |
| Plain-words first screen | Fresh desktop and phone first screens name job, audience, and sample action. |
| Missing metadata, footer, and real 404 | Route-metadata and not-found claims pass; live missing route is HTTP 404. |
| AVIF MIME type | Live response is `image/avif`. |
| Incorrect historical verification evidence | `verification-3.md` contains its correction; this report uses fresh measurements. |

## Scope notes

This static extension product has no backend tenant, health, restart-persistence, rate-limit, or `Retry-After` promise to verify. Its documented consumer artifact is the ZIP; the clean packaged-extension claims exercised it in a clean Chromium consumer profile.

## Handoff

No product code or assets were changed. This report, the handoff update, and the required evidence copy are documentation-only changes. No known product gaps remain.
