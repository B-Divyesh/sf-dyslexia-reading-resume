# Reading Resume v1 handoff

Date: 2026-08-28  
Work order: `dyslexia-reading-resume-build-1`

## Shipped

- WXT + TypeScript Manifest V3 extension in `dist/extension/chrome-mv3/`.
- Per-page local sentence anchors chosen from a selection or the viewport reading position.
- Exact and conservative fuzzy restoration after reload/navigation, with clear no-text, no-anchor, and changed-page errors.
- Focused in-page reading strip with previous/next, save, optional page dimming, responsive stacking, and CSS Highlight synchronization.
- Device `speechSynthesis` reading from the active sentence with configurable speed and between-sentence pause.
- Popup status, recent local places, keyboard shortcuts, settings, JSON export, and confirmed clear-all control.
- $12 one-time Plus purchase/restore path through the slug-based Sociobot API. Daily verdict caching and offline optimistic reuse are implemented. Plus gates only three convenience presets; core reading and export remain free.
- Static Vite landing site with responsive generated artwork, real extension ZIP download, installation steps, offline notice/service worker, `/privacy/`, `/terms/`, robots, and sitemap.
- Product-specific visual and motion system in `.factory/design.md`; generated-art prompt and provenance in `assets/src/reading-coordinate.prompt.json`.

## Build and verification

Exact production command:

```sh
npm install
npm run build
```

Outputs:

- Static deploy root: `dist/site/` (`index.html` at the root)
- Extension directory: `dist/extension/chrome-mv3/`
- Packaged download: `dist/site/downloads/reading-resume-chrome.zip` (`manifest.json` is at archive root)

Verification completed:

- `npm run check` — TypeScript, 6 unit tests, WXT build, Vite build: pass.
- `npm run test:e2e` — 10 passed / 2 intentional project skips: save → reload → exact restore in packaged Chromium extension; extension popup/options axe scans; site interaction; desktop and 390 px; axe WCAG A/AA on home/privacy/terms; no console errors.
- `npm audit --omit=dev` — 0 production vulnerabilities.
- Lighthouse 13 mobile, local production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s, CLS 0, TBT 0 ms.
- Static initial assets: JS 2.33 KB, CSS 12.69 KB, font 54 KB, responsive hero 12–40 KB AVIF / 18–52 KB WebP. Extension total: 42.84 KB.
- Generated hero reviewed at desktop and 390 px: no text artifacts, logos, people, anatomy errors, misleading UI, or broken crop.

## Privacy and permissions

Anchors, preferences, license cache, and exports are local-first. There are no analytics, cookies, cloud reading history, remote article-text calls, runtime CDNs, or secrets. `http://*/*` and `https://*/*` host access is required to locate sentences in ordinary articles; browser-protected pages and built-in viewers remain inaccessible by design.

## Known gaps / next steps

- The extension is distributed as a signed-off unpacked ZIP until Chrome/Edge store review and signing are completed by the factory.
- Built-in PDF viewers, browser settings/store pages, canvas text, cross-origin embedded frames, and publisher-protected content cannot be read; the UI explains this rather than attempting a bypass.
- Available voices and whether a voice is locally installed vary by browser/OS. Reading Resume never claims that TTS or typography treats dyslexia.
- The factory must register the paid product/return URL and exercise a real checkout/refund cycle before release. No product ID is hardcoded.
