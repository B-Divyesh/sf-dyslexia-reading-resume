import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist/extension',
  manifest: {
    name: 'Reading Resume',
    description: 'Save and return to the exact sentence where you stopped reading.',
    version: '1.0.0',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    },
    permissions: ['storage', 'activeTab', 'tabs'],
    host_permissions: ['http://*/*', 'https://*/*'],
    action: { default_title: 'Reading Resume' },
    commands: {
      save_place: {
        suggested_key: { default: 'Alt+Shift+S', mac: 'Alt+Shift+S' },
        description: 'Save the sentence nearest the middle of the page'
      },
      resume_place: {
        suggested_key: { default: 'Alt+Shift+R', mac: 'Alt+Shift+R' },
        description: 'Return to the saved sentence'
      },
      play_pause: {
        suggested_key: { default: 'Alt+Shift+P', mac: 'Alt+Shift+P' },
        description: 'Play or pause reading aloud'
      }
    }
  }
});
