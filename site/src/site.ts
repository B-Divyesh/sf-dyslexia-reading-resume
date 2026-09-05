const PRODUCT = 'dyslexia-reading-resume';
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT}/verify`;

const offline = document.querySelector<HTMLElement>('#offline');
function updateConnection(): void {
  if (offline) offline.hidden = navigator.onLine;
}
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

const params = new URLSearchParams(location.search);
const returnedLicense = params.get('license');
if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  params.delete('license');
  const query = params.toString();
  history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  void verify(returnedLicense);
}

const restoreButton = document.querySelector<HTMLButtonElement>('#restore-license');
const licenseForm = document.querySelector<HTMLFormElement>('#license-form');
const licenseInput = document.querySelector<HTMLInputElement>('#license');
const licenseStatus = document.querySelector<HTMLElement>('#license-status');
if (returnedLicense && licenseForm && licenseInput) {
  licenseForm.hidden = false;
  licenseInput.value = returnedLicense;
}
restoreButton?.addEventListener('click', () => {
  if (!licenseForm) return;
  licenseForm.hidden = false;
  licenseInput?.focus();
});
licenseForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = licenseInput?.value.trim() || '';
  if (!token) {
    licenseInput?.setAttribute('aria-invalid', 'true');
    if (licenseStatus) licenseStatus.textContent = 'Enter the license token from your receipt.';
    licenseInput?.focus();
    return;
  }
  licenseInput?.removeAttribute('aria-invalid');
  void verify(token);
});

async function verify(token: string): Promise<void> {
  if (!licenseStatus) return;
  licenseStatus.textContent = 'Checking your license…';
  try {
    const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`);
    const result = await response.json() as { valid: boolean };
    if (result.valid) {
      localStorage.setItem(LICENSE_KEY, token);
      licenseStatus.textContent = 'Plus is active. Copy the token from your receipt into the extension settings to unlock this browser.';
    } else {
      licenseStatus.textContent = 'That license is not active. Check the token and try again.';
    }
  } catch {
    licenseStatus.textContent = 'The license service could not be reached. Try again when you are online.';
  }
}

document.querySelector('.play')?.addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  button.textContent = button.textContent?.includes('Read') ? 'Ⅱ Pause' : '▶ Read aloud';
});

const DEMO_STORAGE_KEY = 'demo:reading-resume:sample';
const DEMO_SENTENCES = [
  'The repair crew moved the platform sign before the first train arrived.',
  'Mira checked the timetable twice because the weekday service changed without notice.',
  'At 2:15, Mira stopped at the sentence about the train platform.',
  'She wrote the platform number on a paper ticket before putting the timetable away.',
  'The next train arrived on time, and the repaired sign showed the correct destination.'
];

interface DemoState {
  currentIndex: number;
  savedIndex: number | null;
}

function readDemoState(): DemoState {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || 'null') as Partial<DemoState> | null;
    const currentIndex = stored?.currentIndex;
    const savedIndex = stored?.savedIndex;
    if (typeof currentIndex === 'number' && Number.isInteger(currentIndex)
      && (savedIndex === null || (typeof savedIndex === 'number' && Number.isInteger(savedIndex)))) {
      return { currentIndex: Math.max(0, Math.min(DEMO_SENTENCES.length - 1, currentIndex)), savedIndex };
    }
  } catch {
    // A malformed demo record is safely replaced with the built-in sample.
  }
  return { currentIndex: 2, savedIndex: 2 };
}

function initDemo(): void {
  const choices = document.querySelector<HTMLElement>('#sentence-choices');
  const sentence = document.querySelector<HTMLElement>('#demo-sentence');
  const count = document.querySelector<HTMLElement>('#demo-count');
  const place = document.querySelector<HTMLElement>('#demo-place-label');
  const status = document.querySelector<HTMLElement>('#demo-status');
  const previous = document.querySelector<HTMLButtonElement>('#demo-previous');
  const next = document.querySelector<HTMLButtonElement>('#demo-next');
  const save = document.querySelector<HTMLButtonElement>('#demo-save');
  const resume = document.querySelector<HTMLButtonElement>('#demo-resume');
  const read = document.querySelector<HTMLButtonElement>('#demo-read');
  const reset = document.querySelector<HTMLButtonElement>('#reset-demo');
  if (!choices || !sentence || !count || !place || !status || !previous || !next || !save || !resume || !read || !reset) return;

  let state = readDemoState();
  let speaking = false;
  const persist = () => localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  const render = () => {
    sentence.textContent = DEMO_SENTENCES[state.currentIndex]!;
    count.textContent = `Sentence ${state.currentIndex + 1} of ${DEMO_SENTENCES.length}`;
    place.textContent = state.savedIndex === null ? '○ No saved sample place' : '● Saved sample place';
    previous.disabled = state.currentIndex === 0;
    next.disabled = state.currentIndex === DEMO_SENTENCES.length - 1;
    choices.replaceChildren(...DEMO_SENTENCES.map((text, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.demoSelect = String(index);
      button.textContent = `Sentence ${index + 1}`;
      button.setAttribute('aria-pressed', String(index === state.currentIndex));
      button.title = text;
      return button;
    }));
  };
  const move = (change: number) => {
    state.currentIndex = Math.max(0, Math.min(DEMO_SENTENCES.length - 1, state.currentIndex + change));
    persist();
    status.textContent = `Showing sentence ${state.currentIndex + 1} of ${DEMO_SENTENCES.length}.`;
    render();
  };
  choices.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-demo-select]');
    if (!button?.dataset.demoSelect) return;
    state.currentIndex = Number(button.dataset.demoSelect);
    persist();
    status.textContent = `Selected sentence ${state.currentIndex + 1}.`;
    render();
  });
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  save.addEventListener('click', () => {
    state.savedIndex = state.currentIndex;
    persist();
    status.textContent = 'Sample sentence saved. Reload this page, then choose Resume saved sentence.';
    render();
  });
  resume.addEventListener('click', () => {
    if (state.savedIndex === null) {
      status.textContent = 'Save a sample sentence before resuming it.';
      return;
    }
    state.currentIndex = state.savedIndex;
    persist();
    status.textContent = `Returned to saved sentence ${state.currentIndex + 1}.`;
    render();
  });
  read.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      status.textContent = 'Read aloud is not available in this browser.';
      return;
    }
    if (speaking) {
      speechSynthesis.cancel();
      speaking = false;
      read.textContent = '▶ Read aloud';
      status.textContent = 'Sample read aloud paused.';
      return;
    }
    const utterance = new SpeechSynthesisUtterance(DEMO_SENTENCES[state.currentIndex]);
    utterance.onend = () => {
      speaking = false;
      read.textContent = '▶ Read aloud';
      status.textContent = 'Sample read aloud finished.';
    };
    utterance.onerror = () => {
      speaking = false;
      read.textContent = '▶ Read aloud';
      status.textContent = 'Sample read aloud stopped. Try another device voice.';
    };
    speaking = true;
    read.textContent = 'Ⅱ Pause';
    status.textContent = 'Reading the sample with your browser voice.';
    speechSynthesis.speak(utterance);
  });
  reset.addEventListener('click', () => {
    speechSynthesis.cancel();
    speaking = false;
    read.textContent = '▶ Read aloud';
    localStorage.removeItem(DEMO_STORAGE_KEY);
    state = { currentIndex: 2, savedIndex: 2 };
    persist();
    window.postMessage({ type: 'reading-resume-demo-reset' }, location.origin);
    status.textContent = 'Demo reset. The built-in sample place is ready.';
    render();
  });
  persist();
  render();
}

initDemo();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
