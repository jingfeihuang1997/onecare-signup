import { en, type StringKey } from './en';
import { entryText, needsReview } from './entry';
import { DICTIONARIES, LANGUAGES, translate } from './translate';

const KEYS = Object.keys(en) as StringKey[];
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'progress.sectionNamed', { current: 2, total: 6, name: 'Vaccines' })).toBe(
      'Section 2 of 6 · Vaccines',
    );
  });

  it('uses the chosen language', () => {
    expect(translate('es', 'common.continue')).toBe('Continuar');
    expect(translate('zh-Hans', 'common.continue')).toBe('继续');
    expect(translate('es', 'health.q1')).toBe('¿Está enfermo hoy?');
  });

  it('uses the wording of a copy variant where there is one, in every language', () => {
    expect(translate('en', 'start.self', undefined, 'pass')).toBe('Me');
    expect(translate('en', 'start.selfSub', undefined, 'pass')).toBe('I am the one getting the vaccine');
    expect(translate('es', 'start.other', undefined, 'pass')).toBe('Para alguien a quien ayudo');
    expect(translate('zh-Hans', 'sign.lead', undefined, 'pass')).toBe('点下面任意一行可以修改。');
  });
});

describe.each(LANGUAGES)('the %s dictionary', (language) => {
  const dictionary = DICTIONARIES[language];

  it('has every key, and no key that English lacks', () => {
    const present = new Set(Object.keys(dictionary));
    expect(KEYS.filter((key) => !present.has(key))).toEqual([]);
    expect([...present].filter((key) => !(key in en))).toEqual([]);
  });

  it('has text for every key', () => {
    expect(KEYS.filter((key) => entryText(dictionary[key]).trim() === '')).toEqual([]);
  });

  it('uses the same {placeholders} as English', () => {
    const different = KEYS.filter(
      (key) => placeholders(entryText(dictionary[key])).join() !== placeholders(en[key]).join(),
    );
    expect(different).toEqual([]);
  });

  it('keeps every [bracketed placeholder] visible as one', () => {
    const lost = KEYS.filter((key) => en[key].includes('[') !== entryText(dictionary[key]).includes('['));
    expect(lost).toEqual([]);
  });
});

describe('translations that need professional review', () => {
  const expected = [
    ...Array.from({ length: 14 }, (_, index) => `health.q${index + 1}`),
    'sign.agreeTyped',
    'sign.onecareConsentText',
    'sign.pharmacyConsentText',
    'sign.pharmacyConsentText.self',
    'sign.pressAgain',
  ].sort();

  it.each(['es', 'zh-Hans'] as const)('%s: the 14 health questions and the consents are marked', (language) => {
    const marked = KEYS.filter((key) => needsReview(DICTIONARIES[language][key])).sort();
    expect(marked).toEqual(expected);
  });

  it('English is the source, so nothing is marked there', () => {
    expect(KEYS.filter((key) => needsReview(DICTIONARIES.en[key]))).toEqual([]);
  });
});
