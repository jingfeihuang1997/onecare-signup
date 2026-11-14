import type { StringKey } from './en';

/**
 * A translation that a professional translator still has to check: the health questions
 * and the consents (SPEC section 9). It is shown like any other string.
 */
export interface ReviewedEntry {
  text: string;
  needsReview: true;
}

export type Entry = string | ReviewedEntry;

/** A complete dictionary: one entry for every English key. */
export type Dictionary = Record<StringKey, Entry>;

/** Marks a translation as needing professional review. */
export function review(text: string): ReviewedEntry {
  return { text, needsReview: true };
}

export function entryText(entry: Entry): string {
  return typeof entry === 'string' ? entry : entry.text;
}

export function needsReview(entry: Entry): boolean {
  return typeof entry !== 'string' && entry.needsReview;
}
