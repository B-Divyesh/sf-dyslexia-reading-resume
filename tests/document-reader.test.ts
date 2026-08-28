/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { collectPageSentences, sentenceNearestViewport } from '../lib/document-reader';

afterEach(() => {
  document.body.replaceChildren();
  document.getSelection()?.removeAllRanges();
});

describe('selected sentence resolution', () => {
  it('uses the selected second sentence when all sentences share one text node', () => {
    document.body.innerHTML = '<main><p>First sentence is intentionally ordinary. Second sentence is the selected sentence to save. Third sentence closes the test.</p></main>';
    const text = document.querySelector('p')!.firstChild!;
    const start = text.textContent!.indexOf('Second sentence');
    const end = start + 'Second sentence is the selected sentence to save.'.length;
    const selected = document.createRange();
    selected.setStart(text, start);
    selected.setEnd(text, end);
    document.getSelection()!.addRange(selected);

    const sentences = collectPageSentences();
    expect(sentences.map((sentence) => sentence.text)).toEqual([
      'First sentence is intentionally ordinary.',
      'Second sentence is the selected sentence to save.',
      'Third sentence closes the test.'
    ]);
    expect(sentenceNearestViewport(sentences)).toBe(1);
  });
});
