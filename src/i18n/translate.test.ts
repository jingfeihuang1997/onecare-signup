import { en } from './en';
import { es } from './es';
import { translate } from './translate';
import { zhHans } from './zh-Hans';

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'progress.sectionNamed', { current: 2, total: 6, name: 'Vaccines' })).toBe(
      'Section 2 of 6 · Vaccines',
    );
  });

  it('uses the chosen language and falls back to English for a missing key', () => {
    expect(translate('es', 'common.continue')).toBe('Continuar');
    expect(translate('zh-Hans', 'common.continue')).toBe('继续');
    expect(translate('es', 'reason.patient.dob')).toBe(en['reason.patient.dob']);
  });

  it('has no key in es or zh-Hans that English lacks', () => {
    const known = new Set(Object.keys(en));
    expect(Object.keys(es).filter((key) => !known.has(key))).toEqual([]);
    expect(Object.keys(zhHans).filter((key) => !known.has(key))).toEqual([]);
  });
});
