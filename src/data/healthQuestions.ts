import type { StringKey } from '../i18n';
import type { HealthAnswer } from '../types';

// The 14 health questions of SPEC 5.6, in order. Their wording is in the dictionaries and
// must match docs/reference/A10-Health.html exactly; a unit test compares the two.
export const HEALTH_QUESTION_KEYS = [
  'health.q1',
  'health.q2',
  'health.q3',
  'health.q4',
  'health.q5',
  'health.q6',
  'health.q7',
  'health.q8',
  'health.q9',
  'health.q10',
  'health.q11',
  'health.q12',
  'health.q13',
  'health.q14',
] as const satisfies readonly StringKey[];

export const HEALTH_QUESTION_COUNT = HEALTH_QUESTION_KEYS.length;

/** All answers start as "no", kept from the current site at OneCare's direction. */
export function defaultHealthAnswers(): HealthAnswer[] {
  return HEALTH_QUESTION_KEYS.map(() => 'no');
}
