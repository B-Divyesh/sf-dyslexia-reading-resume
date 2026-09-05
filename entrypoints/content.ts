import { collectPageSentences, locateAnchor, makeAnchor, sentenceNearestViewport, type PageSentence } from '../lib/document-reader';
import { getAnchor, getSettings, isDemoUrl, removeAnchor, setAnchor } from '../lib/storage';
import type { ContentRequest, ContentStatus, ReadingSettings, SentenceAnchor } from '../lib/types';

const HIGHLIGHT_NAME = 'reading-resume-current';
let sentences: PageSentence[] = [];
let currentIndex = 0;
let anchor: SentenceAnchor | undefined;
let settings: ReadingSettings;
let host: HTMLDivElement | undefined;
let shadow: ShadowRoot | undefined;
let speaking = false;
let speechGeneration = 0;
let statusText = '';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  async main() {
    settings = await getSettings();
    anchor = await getAnchor(location.href);
    browser.runtime.onMessage.addListener((message: ContentRequest) => handleMessage(message));
    browser.storage.onChanged.addListener(async (changes) => {
      if (changes.readingSettings) {
        settings = await getSettings();
        render();
      }
    });
    if (isDemoUrl(location.href)) {
      window.addEventListener('message', (event) => {
        if (event.source !== window || event.origin !== location.origin || event.data?.type !== 'reading-resume-demo-reset') return;
        void resetDemoPlace();
      });
    }
  }
});

async function resetDemoPlace(): Promise<void> {
  await removeAnchor(location.href);
  anchor = undefined;
  closeStrip();
  statusText = 'Demo place reset.';
}

async function handleMessage(message: ContentRequest): Promise<ContentStatus> {
  try {
    if (message.type === 'GET_STATUS') return getStatus();
    if (message.type === 'SAVE_PLACE') await savePlace();
    if (message.type === 'RESUME_PLACE') await resumePlace();
    if (message.type === 'OPEN_STRIP') await openStrip();
    if (message.type === 'CLOSE_STRIP') closeStrip();
    if (message.type === 'NEXT_SENTENCE') move(1);
    if (message.type === 'PREVIOUS_SENTENCE') move(-1);
    if (message.type === 'PLAY_PAUSE') toggleSpeech();
    return getStatus();
  } catch (error) {
    statusText = error instanceof Error ? error.message : 'Reading Resume could not complete that action.';
    render();
    return { ...getStatus(), error: statusText };
  }
}

function getStatus(): ContentStatus {
  return {
    supported: true,
    hasAnchor: Boolean(anchor),
    sentence: anchor?.sentence,
    savedAt: anchor?.savedAt,
    stripOpen: Boolean(host),
    speaking
  };
}

function refreshSentences(): void {
  sentences = collectPageSentences();
  if (!sentences.length) throw new Error('No readable article text was found on this page.');
}

async function savePlace(): Promise<void> {
  refreshSentences();
  currentIndex = sentenceNearestViewport(sentences);
  anchor = makeAnchor(sentences, currentIndex);
  await setAnchor(anchor);
  statusText = 'Place saved on this device.';
  openAtCurrent();
}

async function resumePlace(): Promise<void> {
  anchor = await getAnchor(location.href);
  if (!anchor) throw new Error('No saved place for this page yet. Save a sentence first.');
  refreshSentences();
  const found = locateAnchor(sentences, anchor);
  if (found < 0) throw new Error('The page changed and the saved sentence could not be matched. Save a new place.');
  currentIndex = found;
  statusText = 'Returned to your saved sentence.';
  openAtCurrent();
}

async function openStrip(): Promise<void> {
  refreshSentences();
  if (anchor) {
    const index = locateAnchor(sentences, anchor);
    currentIndex = index >= 0 ? index : sentenceNearestViewport(sentences);
  } else {
    currentIndex = sentenceNearestViewport(sentences);
  }
  statusText = anchor ? 'Your saved place is ready.' : 'Reading strip opened at the current sentence.';
  openAtCurrent();
}

function openAtCurrent(): void {
  ensureUi();
  highlightCurrent();
  const range = sentences[currentIndex]?.range;
  range?.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  render();
}

function move(change: number): void {
  if (!sentences.length) refreshSentences();
  currentIndex = Math.max(0, Math.min(sentences.length - 1, currentIndex + change));
  statusText = `Sentence ${currentIndex + 1} of ${sentences.length}.`;
  highlightCurrent();
  sentences[currentIndex]?.range.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  render();
}

function toggleSpeech(): void {
  if (!('speechSynthesis' in window)) throw new Error('Read aloud is not available in this browser.');
  if (speaking) {
    speechGeneration += 1;
    speechSynthesis.cancel();
    speaking = false;
    statusText = 'Read aloud paused.';
    render();
    return;
  }
  if (!sentences.length) refreshSentences();
  speaking = true;
  statusText = 'Reading aloud with your device voice.';
  render();
  const generation = ++speechGeneration;
  speakSentence(generation);
}

function speakSentence(generation: number): void {
  const item = sentences[currentIndex];
  if (!speaking || generation !== speechGeneration || !item) {
    speaking = false;
    render();
    return;
  }
  highlightCurrent();
  render();
  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.rate = settings.rate;
  utterance.lang = document.documentElement.lang || navigator.language;
  utterance.onerror = () => {
    speaking = false;
    statusText = 'Read aloud stopped. Try another device voice.';
    render();
  };
  utterance.onend = () => {
    if (!speaking || generation !== speechGeneration) return;
    if (currentIndex >= sentences.length - 1) {
      speaking = false;
      statusText = 'Reached the end of the readable text.';
      render();
      return;
    }
    currentIndex += 1;
    window.setTimeout(() => speakSentence(generation), settings.pauseMs);
  };
  speechSynthesis.speak(utterance);
}

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function highlightCurrent(): void {
  const range = sentences[currentIndex]?.range;
  if (!range) return;
  const cssHighlights = (CSS as typeof CSS & { highlights?: Map<string, Highlight> }).highlights;
  if (cssHighlights && 'Highlight' in window) {
    cssHighlights.set(HIGHLIGHT_NAME, new Highlight(range));
  }
}

function clearHighlight(): void {
  (CSS as typeof CSS & { highlights?: Map<string, Highlight> }).highlights?.delete(HIGHLIGHT_NAME);
}

function closeStrip(): void {
  speechGeneration += 1;
  speechSynthesis.cancel();
  speaking = false;
  clearHighlight();
  host?.remove();
  host = undefined;
  shadow = undefined;
}

function ensureUi(): void {
  if (host) return;
  host = document.createElement('div');
  host.dataset.readingResumeUi = '';
  host.style.all = 'initial';
  shadow = host.attachShadow({ mode: 'closed' });
  document.documentElement.append(host);
  shadow.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'previous') move(-1);
    if (action === 'next') move(1);
    if (action === 'speech') toggleSpeech();
    if (action === 'save') void savePlace();
    if (action === 'close') closeStrip();
  });
}

function render(): void {
  if (!shadow || !host) return;
  const current = sentences[currentIndex];
  host.style.setProperty('--rr-dim', settings.dimPage ? '1' : '0');
  const theme = settings.theme === 'page' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : settings.theme;
  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="veil" aria-hidden="true"></div>
    <section class="strip ${theme}" role="region" aria-label="Reading strip" style="--font-size:${settings.fontSize}px;--line-height:${settings.lineHeight};--strip-width:${settings.stripWidth}px">
      <div class="topline"><span class="place">${anchor ? '● Saved place' : '○ Current sentence'}</span><span aria-live="polite">${escapeHtml(statusText)}</span></div>
      <p>${escapeHtml(current?.text || 'Choose a readable sentence to begin.')}</p>
      <div class="actions">
        <button data-action="previous" aria-label="Previous sentence" ${currentIndex <= 0 ? 'disabled' : ''}>← <span>Previous</span></button>
        <button class="primary" data-action="speech">${speaking ? 'Ⅱ Pause' : '▶ Read aloud'}</button>
        <button data-action="next" ${currentIndex >= sentences.length - 1 ? 'disabled' : ''}><span>Next</span> →</button>
        <button data-action="save">◇ Save place</button>
        <button class="close" data-action="close" aria-label="Close reading strip">×</button>
      </div>
    </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] || char);
}

const styles = `
  :host{all:initial;color-scheme:dark}
  .veil{position:fixed;z-index:2147483646;inset:0;pointer-events:none;background:rgb(3 10 12 / calc(var(--rr-dim) * 42%));transition:background .16s ease}
  .strip{position:fixed;z-index:2147483647;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));max-width:var(--strip-width);margin:auto;padding:16px 18px;background:rgba(9,31,35,.94);color:#f4f5ea;border:1px solid rgba(142,235,225,.35);border-radius:18px;box-shadow:0 20px 64px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.09);backdrop-filter:blur(18px);font-family:Verdana,Arial,sans-serif;animation:rr-enter .24s ease-out}
  .strip.light{background:rgba(250,253,248,.96);color:#10272b;border-color:rgba(8,117,110,.45)}
  .topline{display:flex;gap:12px;justify-content:space-between;color:#b7cbc7;font-size:12px;line-height:1.4}.light .topline{color:#496561}.place{color:#d7f36a;font-weight:700}.light .place{color:#496600}
  p{margin:10px 0 14px;font:var(--font-size)/var(--line-height) Georgia,Charter,serif;letter-spacing:.012em}
  .actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}button{min-height:44px;padding:0 13px;border:1px solid rgba(183,203,199,.38);border-radius:10px;background:rgba(255,255,255,.07);color:inherit;font:700 13px/1 Verdana,Arial,sans-serif;cursor:pointer}button:hover{background:rgba(255,255,255,.14)}button:focus-visible{outline:3px solid #63d8cf;outline-offset:2px}button:disabled{opacity:.42;cursor:not-allowed}.primary{background:#d7f36a;color:#14220a;border-color:#d7f36a}.primary:hover{background:#e7ff8b}.close{margin-left:auto;font-size:22px;width:44px;padding:0}
  @keyframes rr-enter{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
  @media(max-width:520px){.strip{padding:14px}.topline{display:block}.topline span{display:block;margin-bottom:3px}.actions button{flex:1 1 calc(50% - 8px)}.actions .close{flex:0 0 44px}button span{display:none}}
  @media(prefers-reduced-motion:reduce){.strip{animation:none}}
`;
