import type { ContentRequest } from '../lib/types';

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const type: ContentRequest['type'] | undefined = command === 'save_place'
      ? 'SAVE_PLACE'
      : command === 'resume_place'
        ? 'RESUME_PLACE'
        : command === 'play_pause'
          ? 'PLAY_PAUSE'
          : undefined;
    if (type) await browser.tabs.sendMessage(tab.id, { type }).catch(() => undefined);
  });
});
