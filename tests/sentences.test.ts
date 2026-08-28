import { describe, expect, it } from 'vitest';
import { bestSentenceIndex, normalizeSentence, similarity, splitSentences } from '../lib/sentences';
import { anchorKey, normalizePageUrl } from '../lib/storage';

describe('sentence matching', () => {
  it('segments prose while preserving useful punctuation', () => {
    const parts = splitSentences('A first sentence. A harder second sentence! Is this third?', 'en');
    expect(parts.map((item) => item.text)).toEqual(['A first sentence.', 'A harder second sentence!', 'Is this third?']);
  });

  it('normalizes layout whitespace without damaging words', () => {
    expect(normalizeSentence('  return\n to   this place. ')).toBe('return to this place.');
  });

  it('restores an exact sentence after surrounding content changes', () => {
    const current = splitSentences('New introduction. Keep this exact sentence. New ending.', 'en');
    expect(bestSentenceIndex(current, 'Keep this exact sentence.', 9)).toBe(1);
  });

  it('finds a lightly edited sentence using word overlap', () => {
    const current = splitSentences('Unrelated opening. Return reliably to this same difficult passage after an interruption.', 'en');
    expect(bestSentenceIndex(current, 'Return to this difficult passage reliably after interruption.', 1)).toBe(1);
    expect(similarity(current[1]!.text, 'Return to this difficult passage reliably after interruption.')).toBeGreaterThan(0.7);
  });

  it('refuses an unrelated fallback', () => {
    const current = splitSentences('Nothing in this article resembles the stored text.', 'en');
    expect(bestSentenceIndex(current, 'A completely different remembered sentence.', 0)).toBe(-1);
  });
});

describe('local anchor keys', () => {
  it('drops fragments and tracking parameters but preserves page identity', () => {
    expect(normalizePageUrl('https://example.com/read?utm_source=x&chapter=2#middle')).toBe('https://example.com/read?chapter=2');
    expect(anchorKey('https://example.com/read#later')).toBe('anchor:https://example.com/read');
  });
});
