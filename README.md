# Reading Resume

Reading Resume is a local-first Chrome/Edge extension for readers who lose their place in difficult web passages. It saves an exact sentence per page, restores it after navigation or reload, and offers an adjustable reading strip with optional device read-aloud pacing.

Live product page: <https://dyslexia-reading-resume.sociobot.in>

## What v1 includes

- Save the selected sentence, or the sentence nearest the center of the viewport.
- Restore by exact text and a conservative fuzzy fallback when a page changes slightly.
- Move sentence by sentence in a focused strip; adjust size, spacing, width, surface, voice speed, and pauses.
- Start or pause browser/device speech from the current sentence.
- Keep page anchors and preferences in `browser.storage.local`; no account, tracking, or article-text API.
- Export or clear local saved places.
- Keyboard commands: `Alt+Shift+S` save, `Alt+Shift+R` resume, `Alt+Shift+P` play/pause.
- Optional $12 one-time Plus license for three convenience presets. Core reading, accessibility settings, and export remain free.

Reading Resume is reading support, not diagnosis or treatment. It does not bypass protected content, browser pages, paywalls, or built-in PDF viewers.

## Develop

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev          # WXT extension development
npm run dev:site     # landing site development
npm test             # unit tests
npm run test:e2e     # Chromium extension flow, 390 px, and axe checks
npm run check        # TypeScript + unit tests + production build
```

The reproducible production command is:

```sh
npm run build
```

It produces:

- `dist/extension/chrome-mv3/` — unpacked MV3 extension
- `dist/site/` — static deploy root, with `index.html`, `/privacy/`, and `/terms/`
- `dist/site/downloads/reading-resume-chrome.zip` — installable extension archive with `manifest.json` at its root

To install locally, unzip the archive, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the unzipped folder.

## Architecture and privacy

WXT builds the TypeScript Manifest V3 extension. The content script uses `Intl.Segmenter`, DOM ranges, and the CSS Custom Highlight API; speech uses `speechSynthesis`. The static Vite site contains no framework, CDN, analytics, cookies, or third-party runtime scripts. See [privacy](site/privacy/index.html) and [terms](site/terms/index.html).

The visual system and original-image provenance are in [.factory/design.md](.factory/design.md). Atkinson Hyperlegible is self-hosted under the SIL Open Font License; the application code is MIT licensed.

## Deployment

Deploy `dist/site/` as the static root. The factory handles DNS, infrastructure, and paid-product registration. The site and extension use the slug-based Sociobot billing endpoints and contain no provider product ID or secret.
