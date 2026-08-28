export interface SentenceLocation {
  text: string;
  start: number;
  end: number;
}

export interface SentenceContext {
  prefix?: string;
  suffix?: string;
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

export function bestSentenceIndex(
  sentences: SentenceLocation[],
  target: string,
  expectedIndex = 0,
  context?: SentenceContext
): number {
  const normalizedTarget = normalizeSentence(target);
  const exactMatches = sentences
    .map((item, index) => normalizeSentence(item.text) === normalizedTarget ? index : -1)
    .filter((index) => index >= 0);
  if (exactMatches.length === 1) return exactMatches[0]!;
  if (exactMatches.length > 1) {
    return exactMatches.reduce((best, candidate) => {
      const bestContext = neighborContextScore(sentences, best, context);
      const candidateContext = neighborContextScore(sentences, candidate, context);
      if (candidateContext !== bestContext) return candidateContext > bestContext ? candidate : best;
      return Math.abs(candidate - expectedIndex) < Math.abs(best - expectedIndex) ? candidate : best;
    });
  }
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

function neighborContextScore(sentences: SentenceLocation[], index: number, context?: SentenceContext): number {
  if (!context) return 0;
  const comparisons: Array<[string, string | undefined]> = [
    [sentences[index - 1]?.text || '', context.prefix],
    [sentences[index + 1]?.text || '', context.suffix]
  ];
  let score = 0;
  let count = 0;
  for (const [actual, expected] of comparisons) {
    if (expected === undefined) continue;
    const normalizedActual = normalizeSentence(actual);
    const normalizedExpected = normalizeSentence(expected);
    score += normalizedActual === normalizedExpected
      ? 1
      : similarity(normalizedActual, normalizedExpected);
    count += 1;
  }
  return count ? score / count : 0;
}
