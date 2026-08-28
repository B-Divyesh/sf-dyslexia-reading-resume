export interface SentenceAnchor {
  url: string;
  title: string;
  sentence: string;
  prefix: string;
  suffix: string;
  sentenceIndex: number;
  savedAt: number;
}

export interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  stripWidth: number;
  rate: number;
  pauseMs: number;
  dimPage: boolean;
  theme: 'dark' | 'light' | 'page';
}

export interface LicenseCache {
  token: string;
  valid: boolean;
  checkedAt: number;
  reason?: string;
}

export const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 20,
  lineHeight: 1.65,
  stripWidth: 760,
  rate: 0.9,
  pauseMs: 300,
  dimPage: false,
  theme: 'dark'
};

export type ContentRequest =
  | { type: 'GET_STATUS' }
  | { type: 'SAVE_PLACE' }
  | { type: 'RESUME_PLACE' }
  | { type: 'PLAY_PAUSE' }
  | { type: 'NEXT_SENTENCE' }
  | { type: 'PREVIOUS_SENTENCE' }
  | { type: 'OPEN_STRIP' }
  | { type: 'CLOSE_STRIP' };

export interface ContentStatus {
  supported: boolean;
  hasAnchor: boolean;
  sentence?: string;
  savedAt?: number;
  stripOpen: boolean;
  speaking: boolean;
  error?: string;
}
