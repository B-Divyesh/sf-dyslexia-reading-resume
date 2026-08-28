export interface SentenceLocation {
  text: string;
  start: number;
  end: number;
}

export function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function splitSentences(text: string, locale = globalThis.document?.documentElement.lang || globalThis.navigator?.language || 'en'): SentenceLocation[] {
  const output: SentenceLocation[] = [];
  if ('Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' });
    for (const item of segmenter.segment(text)) {
      const normalized = normalizeSentence(item.segment);
      if (normalized.length >= 2) output.push({ text: normalized, start: item.index, end: item.index + item.segment.length });
    }
    return output;
  }
  const matcher = /[^.!?]+(?:[.!?]+[”’"']?|$)/g;
  for (const match of text.matchAll(matcher)) {
    if (match.index === undefined) continue;
    const normalized = normalizeSentence(match[0]);
    if (normalized.length >= 2) output.push({ text: normalized, start: match.index, end: match.index + match[0].length });
  }
  return output;
}

export function similarity(a: string, b: string): number {
  const wordsA = new Set(normalizeSentence(a).toLocaleLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(normalizeSentence(b).toLocaleLowerCase().split(/\W+/).filter(Boolean));
  if (!wordsA.size || !wordsB.size) return 0;
  let shared = 0;
  for (const word of wordsA) if (wordsB.has(word)) shared += 1;
  return (2 * shared) / (wordsA.size + wordsB.size);
}

export function bestSentenceIndex(sentences: SentenceLocation[], target: string, expectedIndex = 0): number {
  const exact = sentences.findIndex((item) => normalizeSentence(item.text) === normalizeSentence(target));
  if (exact >= 0) return exact;
  let best = -1;
  let score = 0;
  sentences.forEach((item, index) => {
    const contentScore = similarity(item.text, target);
    const distanceBonus = Math.max(0, 0.04 - Math.abs(index - expectedIndex) * 0.0005);
    if (contentScore + distanceBonus > score) {
      score = contentScore + distanceBonus;
      best = index;
    }
  });
  return score >= 0.58 ? best : -1;
}
