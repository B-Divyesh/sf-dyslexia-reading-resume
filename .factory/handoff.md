# Reading Resume — repair handoff

- Date: 2026-09-05
- Work order: `dyslexia-reading-resume-repair-3`
- Implementation commit: `ce19f6b1173bbdc57f816f4da2506c4df5746582`
- Documentation correction commit: `24005d9f3e56bb29746c1fe51c36079617e4fe47`
- Handoff documentation commit: `1bfa37798e260cdb5d1f67edc0953db32bf051c6`
- Live URL: <https://dyslexia-reading-resume.sociobot.in/>
- Deployment: Static Web App `sf-dyslexia-reading-resume`, existing production app reused; upload succeeded.
- Verdict: **PASS**

## Job, audience, and first action

The job is to save one exact sentence in a difficult web article and return to it later. The audience is dyslexic web readers who lose their place after an interruption. The first action is **Try it with sample data**, which opens `/demo/` with a saved sentence already visible.

## What changed

- Added `/demo/`: a one-click, realistic station-note sample with a persistent **Demo — sample data, nothing is saved** banner, Reset demo, Start for real, sentence controls, save/resume, and browser read aloud.
- Isolated website demo state under `demo:reading-resume:sample` and packaged-extension demo anchors under `demo:anchor:`. Resetting the page also removes the extension demo anchor; normal `anchor:` data is not read or changed.
- Added `.factory/demo.md`, `.factory/claims.json`, and 19 observable claim-tagged Playwright checks. Every manifest command was run. Claims exercise the packaged MV3 extension on `/demo/` where appropriate.
- Rewrote the first screen and product copy in plain words. Added `.factory/copy-audit.md` and a verb-first catalog description, copied to `/work/.evidence/catalog-description.txt`.
- Fixed the 390 px overflow at its cause by replacing the losing `repair.css` cascade with a bounded responsive hero. The browser project now uses a true 390 CSS-pixel layout viewport.
- Added announced blank-license recovery text and focus return.
- Added canonical, Open Graph, Twitter, favicon, Apple-touch metadata; consistent header/footer/build ID; a designed `404.html`; `/demo/` sitemap entry; a 1200 × 630 social image derived from the product art; and an actual 404 response override.
- Added the static-host `.avif → image/avif` MIME mapping. The release now serves AVIF as `image/avif`.
- Preserved core extension behavior and added demo-scoped export/clear coverage.

## Finding disposition

| Review finding | Current disposition |
| --- | --- |
| No isolated sample demo | Fixed: `/demo/`, persistent label, reset, separate namespaces, and documentation. |
| Missing claims manifest/tests | Fixed: 19 declared claim checks and complete manifest-command run. |
| Plain-words first screen/copy | Fixed: job, audience, first action, three facts, and copy audit. |
| 390 px overflow | Fixed: live desktop and mobile `scrollWidth === clientWidth`. |
| Blank web license restoration | Fixed: announced “Enter the license token from your receipt.” and focus recovery. |
| Metadata, footer, and 404 | Fixed: route-specific metadata, consistent skeleton, HTTP 404 with return actions. |
| AVIF MIME type | Fixed: live response is `image/avif`. |
| False prior PASS evidence | Corrected in the documentation correction commit above. |

The earlier selected-sentence, duplicate-sentence, clean-checkout, download ZIP, cache/update, and extension blank-license findings remain covered by regression checks and passed again.

## Verification

From a fresh clone of the implementation commit:

```sh
npm ci
npm run check          # TypeScript, 10 Vitest tests, extension/site build
npm run test:e2e       # 54 total; expected mobile skips cover extension-only flows
npm audit --omit=dev   # 0 production vulnerabilities
```

All 19 exact commands in `.factory/claims.json` passed. The complete tagged suite also passed with `npm run test:claims`.

Accessibility and browser checks:

- Local and live Playwright Axe scans: zero serious/critical findings on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html`.
- Fresh live desktop and 390 × 844 phone contexts: one H1 and main landmark on each route; no valid-route console errors; visible demo banner; real state unchanged by the demo; no horizontal overflow; same-origin-only demo traffic.
- Live `/does-not-exist` returns the intentional HTTP 404 and the designed route. The resulting network console entry is expected, not a page defect.
- Live download is `application/zip`; all 15 unzipped payloads byte-match the local packaged extension.
- Live AVIF response: `image/avif`.
- Local Lighthouse against `/demo/`: Performance 100, Accessibility 100, FCP 1.0 s, LCP 1.4 s, TBT 0 ms, CLS 0.
- Budgets: initial JS 6.09 kB, CSS 14.75 kB, local font 54.35 kB, mobile AVIF 10.53 kB, social image 67.15 kB, and unpacked extension 43.99 kB.

## Known gaps

There are no known product blockers. `npm audit` without `--omit=dev` still reports 12 development-tool advisories; the production-only audit is clean. The normal free reader does not depend on the optional license or external billing service.

## Next steps

Store distribution remains the only external dependency. The published ZIP can be installed now; submit the same MV3 package to browser stores when product registration is available.
