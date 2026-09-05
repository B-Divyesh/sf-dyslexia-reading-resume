# Reading Resume

Reading Resume is a Chrome and Edge extension for dyslexic web readers who need to return to one exact sentence after an interruption.

Start with the [sample article](https://dyslexia-reading-resume.sociobot.in/demo/). It shows a saved place immediately. The demo uses separate `demo:` storage, so it never reads or changes real saved places. Resetting the demo restores only the shipped sample.

## What it does

- Saves a selected sentence and returns to it after a reload.
- Uses nearby context to return to the selected occurrence when text repeats.
- Opens a reading strip that moves sentence by sentence.
- Uses the browser or device voice for optional read aloud.
- Keeps saved places in browser storage. The extension does not send article text to Reading Resume.
- Exports or clears saved places from extension settings.
- Keeps the reader free. Optional reading-strip presets cost $12 once. There is no subscription.

Reading Resume is reading support. It does not diagnose or treat dyslexia. It cannot bypass protected browser pages, paywalls, access controls, or publisher restrictions.

## Install the extension

1. Download [`reading-resume-chrome.zip`](https://dyslexia-reading-resume.sociobot.in/downloads/reading-resume-chrome.zip).
2. Unzip the archive.
3. Open `chrome://extensions` or `edge://extensions`.
4. Turn on Developer mode, choose **Load unpacked**, and select the unzipped folder.

## Develop and verify

Requires Node.js 22+ and npm.

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit --omit=dev
```

The browser suite runs the packaged MV3 extension, the static site, the `/demo/` sandbox, 390 CSS-pixel layout, keyboard and accessibility checks, and offline reload.

Public claims are listed in [.factory/claims.json](.factory/claims.json). Run an individual claim command exactly as recorded there. The complete claim-tagged suite is also available with:

```sh
npm run test:claims
```

`npm run build` creates:

- `dist/extension/chrome-mv3/` — unpacked MV3 extension
- `dist/site/` — static site with `/`, `/demo/`, `/privacy/`, `/terms/`, and a designed `404.html`
- `dist/site/downloads/reading-resume-chrome.zip` — installable archive with `manifest.json` at its root

## Privacy, scope, and deployment

The site has no analytics, advertising, third-party runtime scripts, or remote fonts. Saved anchors and settings use `browser.storage.local`. The optional license path connects only to the Sociobot billing endpoint when a buyer chooses it. Read the [privacy policy](site/privacy/index.html) and [terms](site/terms/index.html).

Deploy `dist/site/` as the static root. The deployment configuration supplies caching, CSP, `image/avif`, and a real 404 response. The factory handles DNS, infrastructure, and paid-product registration.

The visual system and original-art provenance are in [.factory/design.md](.factory/design.md). The application is MIT licensed; Atkinson Hyperlegible is included under the SIL Open Font License.
