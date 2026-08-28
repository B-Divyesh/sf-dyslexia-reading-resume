import { bestSentenceIndex, normalizeSentence, splitSentences, type SentenceLocation } from './sentences';
import type { SentenceAnchor } from './types';

interface TextRun {
  node: Text;
  start: number;
  end: number;
}

export interface PageSentence extends SentenceLocation {
  range: Range;
}

const EXCLUDED = 'script, style, noscript, svg, nav, footer, header, aside, form, button, input, textarea, select, [aria-hidden="true"], [data-reading-resume-ui]';

function contentRoot(): HTMLElement {
  return document.querySelector<HTMLElement>('article, main, [role="main"]') || document.body;
}

function buildTextModel(): { text: string; runs: TextRun[] } {
  const root = contentRoot();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      const content = node.textContent || '';
      if (!parent || !content.trim() || parent.closest(EXCLUDED)) return NodeFilter.FILTER_REJECT;
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const runs: TextRun[] = [];
  let text = '';
  while (walker.nextNode() && runs.length < 12000) {
    const node = walker.currentNode as Text;
    const value = node.textContent || '';
    const start = text.length;
    text += `${value}\n`;
    runs.push({ node, start, end: start + value.length });
  }
  return { text, runs };
}

function offsetToPoint(runs: TextRun[], offset: number, preferEnd = false): { node: Text; offset: number } | undefined {
  const run = runs.find((item) => offset >= item.start && (preferEnd ? offset <= item.end : offset < item.end));
  if (run) return { node: run.node, offset: Math.max(0, Math.min(run.node.length, offset - run.start)) };
  const last = runs.at(-1);
  return last ? { node: last.node, offset: last.node.length } : undefined;
}

export function collectPageSentences(): PageSentence[] {
  const { text, runs } = buildTextModel();
  return splitSentences(text).flatMap((sentence) => {
    const start = offsetToPoint(runs, sentence.start);
    const end = offsetToPoint(runs, Math.max(sentence.start, sentence.end - 1), true);
    if (!start || !end) return [];
    try {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, Math.min(end.node.length, end.offset + 1));
      return [{ ...sentence, range }];
    } catch {
      return [];
    }
  });
}

export function sentenceNearestViewport(sentences: PageSentence[]): number {
  const selection = document.getSelection();
  if (selection?.rangeCount && !selection.isCollapsed) {
    const selected = selection.getRangeAt(0);
    const index = sentences.findIndex((item) => item.range.intersectsNode(selected.commonAncestorContainer));
    if (index >= 0) return index;
  }
  const targetY = window.innerHeight * 0.44;
  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  sentences.forEach((item, index) => {
    const rect = item.range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    const itemDistance = Math.abs(rect.top + rect.height / 2 - targetY);
    if (itemDistance < distance) {
      distance = itemDistance;
      best = index;
    }
  });
  return best;
}

export function makeAnchor(sentences: PageSentence[], index: number): SentenceAnchor {
  const item = sentences[index];
  if (!item) throw new Error('No readable sentence was found on this page.');
  return {
    url: location.href,
    title: document.title || location.hostname,
    sentence: normalizeSentence(item.text),
    prefix: sentences[index - 1]?.text || '',
    suffix: sentences[index + 1]?.text || '',
    sentenceIndex: index,
    savedAt: Date.now()
  };
}

export function locateAnchor(sentences: PageSentence[], anchor: SentenceAnchor): number {
  const mainIndex = bestSentenceIndex(sentences, anchor.sentence, anchor.sentenceIndex);
  if (mainIndex < 0) return -1;
  const candidate = sentences[mainIndex];
  if (!candidate) return -1;
  return mainIndex;
}
