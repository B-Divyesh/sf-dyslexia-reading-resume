import { listAnchors } from '../../lib/storage';
import type { ContentRequest, ContentStatus } from '../../lib/types';
import './style.css';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
let activeTabId: number | undefined;

async function send(type: ContentRequest['type']): Promise<ContentStatus | undefined> {
  if (!activeTabId) return;
  try {
    return await browser.tabs.sendMessage(activeTabId, { type });
  } catch {
    showUnsupported();
  }
}

function setEnabled(enabled: boolean): void {
  ['save', 'strip', 'speech'].forEach((id) => (($<HTMLButtonElement>(`#${id}`).disabled = !enabled)));
}

function update(status?: ContentStatus): void {
  if (!status?.supported) return showUnsupported();
  setEnabled(true);
  $('#resume').toggleAttribute('disabled', !status.hasAnchor);
  $('#state-label').textContent = status.hasAnchor ? 'Place saved' : 'Ready to mark';
  $('#message').textContent = status.error || (status.hasAnchor ? 'Your sentence is stored locally on this device.' : 'Scroll or select text, then save the sentence where you stopped.');
  const quote = $('#sentence');
  quote.hidden = !status.sentence;
  quote.textContent = status.sentence ? `“${status.sentence}”` : '';
  $('#speech').textContent = status.speaking ? 'Pause read aloud' : 'Read aloud';
  $('#strip').textContent = status.stripOpen ? 'Reading strip is open' : 'Open reading strip';
}

function showUnsupported(): void {
  setEnabled(false);
  $('#resume').setAttribute('disabled', '');
  $('#state-label').textContent = 'Unavailable here';
  $('#message').textContent = 'Browser settings, protected store pages, and built-in PDF viewers do not allow reading tools. Open a regular article tab.';
}

async function loadRecent(): Promise<void> {
  const list = $('#recent-list');
  const anchors = (await listAnchors()).slice(0, 3);
  if (!anchors.length) return;
  list.innerHTML = anchors.map((item) => `<li><button data-url="${escapeHtml(item.url)}"><span>${escapeHtml(item.title)}</span><small>${new Date(item.savedAt).toLocaleDateString()}</small></button></li>`).join('');
  list.addEventListener('click', async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-url]');
    if (button?.dataset.url) await browser.tabs.create({ url: button.dataset.url });
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] || char);
}

async function init(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id;
  $('#page-title').textContent = tab?.title || 'Current page';
  update(await send('GET_STATUS'));
  await loadRecent();

  $('#save').addEventListener('click', async () => update(await send('SAVE_PLACE')));
  $('#resume').addEventListener('click', async () => update(await send('RESUME_PLACE')));
  $('#strip').addEventListener('click', async () => update(await send('OPEN_STRIP')));
  $('#speech').addEventListener('click', async () => update(await send('PLAY_PAUSE')));
  $('#settings').addEventListener('click', () => browser.runtime.openOptionsPage());
}

void init();
