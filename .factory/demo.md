# Reading Resume demo

Open <https://dyslexia-reading-resume.sociobot.in/demo/> or run the local site and open `/demo/`.

The demo starts with a realistic five-sentence station note. It shows a saved third sentence, lets a visitor choose another sentence, save it, reload, resume it, use the sentence controls, and start browser read aloud.

The website sample uses the `demo:reading-resume:sample` localStorage key. It never reads or writes non-demo website storage. When the packaged extension runs on `/demo/`, it uses `demo:anchor:` keys in `browser.storage.local`; ordinary saved places continue to use `anchor:`. **Reset demo** restores only the shipped sample state and asks the extension to remove the demo anchor. **Start for real** returns to the landing page.

Every entry in `.factory/claims.json` starts from this route in a fresh browser context. The extension claims load the packaged MV3 artifact against this sample route.
