# Save your place in a web article — review 2

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-review-2`
- Verdict: **FAIL**
- Finding count: **1**
- Untested claim count: **7**
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Implementation candidate reviewed: `ce19f6b1173bbdc57f816f4da2506c4df5746582`
- Documentation revision reviewed: `7f56026a87f0ecee32e1a4f7355691d9a8c711e1`

## Job, audience, and first action

The job is to save one exact sentence in a web article and return to it after an interruption. The audience is dyslexic web readers who lose their place in difficult reading. The first action is **Try it with sample data**, which opens the populated `/demo/` sample.

## Verdict

**FAIL.** The live product and its packaged extension work for the core job, but the public-claims contract is incomplete. This review cannot declare PASS while seven public claims are untested or their designated claim tests do not assert the claimed outcome.

## Finding

### Moderate — public claims lack complete observable sandbox coverage

All 19 commands declared in `.factory/claims.json` passed, but the manifest and its tagged tests do not meet the claims contract for the following seven claims.

1. **Article text is not sent to Reading Resume.** This appears on the landing page, README, and privacy policy. There is no claim entry or packaged-extension request-recording test that saves, resumes, and reads an article while asserting that no article text leaves the browser.
2. **Normal saved places and settings stay in browser storage.** The `local-anchor-storage` test covers only a demo anchor. It does not prove normal `anchor:` data or settings are local.
3. **The website has no analytics, advertising trackers, cookies, or third-party runtime scripts.** `no-tracking` records origins only during a demo flow. It neither covers the stated website-wide/cookie assertion nor declares that broader claim.
4. **Plus adds three one-tap reading-strip presets.** The price test only displays the price. No claim test uses a valid recorded license fixture, exposes the three presets, and verifies a preset changes and persists settings.
5. **The free reader remains available offline.** `offline-demo` correctly proves the static sample reloads offline, but it does not exercise the packaged free extension offline.
6. **Read aloud starts with the visible sample sentence.** The designated `@claim:read-aloud` test replaces `speechSynthesis.speak` with a no-op and checks only status text and button text. It never captures the `SpeechSynthesisUtterance` passed to `speak`, so it does not prove the visible sentence is spoken.
7. **Saving, returning, read aloud, accessibility controls, and export stay free.** The designated `@claim:free-core` test checks only the sample's explanatory text. It does not use a clean, unlicensed packaged extension to perform those free actions.

The live source and the broader browser suite give useful supporting evidence, but they cannot substitute for a declared, observable test for each visitor-reliant claim. Add a claim entry and one tagged sandbox test per item above, or remove/narrow the corresponding public statement. The tests should use a clean packed-extension profile where the claim is about the extension.

## What passed

### Clean checkout and declared commands

A fresh clone at `7f56026` was installed with only `npm ci`.

```sh
npm ci                         # passed
npm run check                  # passed: type check, 10 Vitest tests, production build
npm run test:e2e               # passed: 54 browser tests
npm audit --omit=dev --json    # passed: 0 production vulnerabilities
```

Each of the 19 exact commands recorded in `.factory/claims.json` was also run separately. Every command passed. The individual tagged runs covered demo isolation, save/reload/resume, read aloud, offline reload, no third-party demo requests, pricing, free-core copy, ZIP response, license recovery, route metadata, 404, 390 px layout, and all seven packaged-MV3 anchor/strip/export cases.

### Live desktop and phone checks

- Fresh desktop and 390 × 844 contexts showed one H1, a `main` landmark, `lang="en"`, and the job, audience, and sample action before scrolling. The phone page measured `scrollWidth === clientWidth === 390`.
- The live demo showed **Demo — sample data, nothing is saved**, Reset demo, Start for real, and a realistic five-sentence station note. Saving sentence 5, reloading, choosing sentence 1, and resuming returned sentence 5. Reset restored sentence 3.
- A seeded non-demo website storage value remained `unchanged` through the demo flow. Demo state was stored under `demo:reading-resume:sample`.
- Blank license recovery announced “Enter the license token from your receipt.”, set `aria-invalid`, and returned focus to the input.
- The first keyboard Tab reached the skip link. Reduced-motion desktop/phone styles reduced animation and transition duration to `0.01ms`.
- Axe found zero serious or critical violations on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html`. No page errors, non-404 console errors, or third-party requests appeared in the inspected live flow.
- After first load and service-worker control, live `/demo/` reloaded offline with HTTP 200, title `Demo — Reading Resume`, its heading, and its persistent demo banner.
- All collected same-origin links returned HTTP 200. `/does-not-exist` returned the deliberate HTTP 404 with a designed page, one H1, main landmark, and a route back. The expected network 404 is not a defect.

### Deployment and artifact checks

- The live `/` SHA-256 (`be555df13798c826a417a0a5802b4cd710e635ab8ab1da5e3b0841e4ccfc843e`) and `/sw.js` matched the fresh candidate build byte-for-byte.
- The live download returned `200 application/zip`. Its 15 extracted payload files matched the local packaged MV3 artifact.
- Live AVIF returned `image/avif`. Live responses supplied CSP, HSTS, `nosniff`, strict referrer policy, frame denial, Permissions-Policy, and the expected cache policies.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| No isolated sample sandbox | Fixed and passed: `/demo/`, persistent label, reset, start-for-real, realistic state, and separate demo storage. |
| Claims manifest absent | Fixed in part: manifest and 19 commands exist and pass; this review finds the remaining coverage gap above. |
| Plain-words first screen | Fixed and passed in fresh desktop and phone checks. |
| 390 px horizontal overflow | Fixed and passed: live document width is exactly 390 px. |
| Blank web license recovery | Fixed and passed with announced error and focus return. |
| Metadata, footer, and designed HTTP 404 missing | Fixed and passed. |
| AVIF MIME type | Fixed and passed: `image/avif`. |
| Historical verification evidence was inaccurate | Corrected in `verification-3.md`; current artifact and live identity were independently rechecked. |
| Selected-sentence and duplicate-occurrence regressions | Passed through the packaged MV3 claim commands. |
| ZIP payload, clean setup, cache/update, and response policies | Passed through clean build, archive comparison, offline reload, and header checks. |

## Scope note

This static browser-extension product has no backend tenant, health, restart-persistence, or rate-limit promise to test. The installed-consumer artifact was exercised by the packaged-MV3 claim tests in a fresh Chromium profile.

## Required next work

Keep the product behavior unchanged, but complete the claims manifest and tests described in the finding. Re-run every declared command from a fresh checkout and then repeat this review. Until then, the correct verdict is **FAIL**.
