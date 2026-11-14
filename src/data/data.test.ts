import referenceHtml from '../../docs/reference/A10-Health.html?raw';
import { en, formatClinicDate, formatClinicTime, formatDate, translate } from '../i18n';
import { parseDob, toIsoDate } from '../state/dates';
import { isAllowedAtAge, MOCK_AGE_RULES } from './ageRules';
import { defaultHealthAnswers, HEALTH_QUESTION_KEYS } from './healthQuestions';
import { RELATIONSHIPS } from './relationships';
import { SEED_CLINIC, SEED_HELPER, SEED_MARIA, SEED_NEW_PATIENT, SEED_RECORDS } from './seed';
import { getVaccine, VACCINE_IDS, VACCINES } from './vaccines';

describe('vaccine catalog', () => {
  it('has the 16 vaccines of SPEC 5.3, each once', () => {
    const spec = [
      'flu', 'covid', 'tdap', 'shingles', 'pneumococcal', 'rsv', 'hepb', 'mmr',
      'varicella', 'hpv', 'menacwy', 'dtap', 'hib', 'rotavirus', 'polio', 'hepa',
    ];
    expect(VACCINES).toHaveLength(16);
    expect([...VACCINE_IDS].sort()).toEqual([...spec].sort());
    expect(new Set(VACCINES.map((vaccine) => vaccine.displayOrder)).size).toBe(16);
  });

  it('has a name, a short name and "Why it matters" copy for every vaccine', () => {
    for (const id of VACCINE_IDS) {
      expect(en[`vaccine.${id}.name`]).toBeTruthy();
      expect(en[`vaccine.${id}.short`]).toBeTruthy();
      expect(en[`vaccine.${id}.why`]).toBeTruthy();
    }
    expect(en['vaccine.flu.name']).toBe('Influenza (flu)');
    expect(getVaccine('covid').products[0]?.name).toBe('Spikevax (Moderna)');
  });

  it('reaches every vaccine at some age under the mock rules', () => {
    for (const id of VACCINE_IDS) {
      const ages = Array.from({ length: 101 }, (_, age) => age);
      expect(ages.some((age) => isAllowedAtAge(MOCK_AGE_RULES, id, age))).toBe(true);
    }
  });
});

describe('health questions', () => {
  it('has 14 questions that all start as No', () => {
    expect(HEALTH_QUESTION_KEYS).toHaveLength(14);
    expect(defaultHealthAnswers()).toEqual(Array(14).fill('no'));
  });

  it('uses the exact wording of docs/reference/A10-Health.html', () => {
    const reference = [...referenceHtml.matchAll(/<p class="oc-q__text">(\d+)\. ([^<]*)<\/p>/g)].map(
      (match) => match[2],
    );
    expect(reference).toHaveLength(14);
    expect(HEALTH_QUESTION_KEYS.map((key) => en[key])).toEqual(reference);
  });
});

describe('seed data', () => {
  it('reproduces the reference scenario', () => {
    expect(SEED_CLINIC.pharmacy.name).toBe('Cedar Lane Pharmacy');
    expect(
      translate('en', 'clinic.dateAtTime', {
        date: formatClinicDate(SEED_CLINIC.date, 'en'),
        time: formatClinicTime(SEED_CLINIC.time, 'en'),
      }),
    ).toBe('Tue, Dec 1, 2026 at 10:00 AM');

    const birth = parseDob(SEED_MARIA.dob);
    expect(`${SEED_MARIA.firstName} ${SEED_MARIA.lastName}`).toBe('Maria Lopez');
    expect(birth && formatDate(toIsoDate(birth), 'en')).toBe('Apr 12, 1954');
    expect(`${SEED_HELPER.firstName} ${SEED_HELPER.lastName}`).toBe('Ana Lopez');
    expect(SEED_CLINIC.offeredVaccines).toHaveLength(16);
  });

  it('keeps placeholders visible instead of inventing values', () => {
    expect(SEED_CLINIC.address).toBe('[Clinic address]');
    expect(SEED_CLINIC.pharmacy.phone).toBe('[pharmacy phone]');
  });

  it('has a second patient with no record', () => {
    const known = SEED_RECORDS.some(
      (record) =>
        record.firstName === SEED_NEW_PATIENT.firstName && record.lastName === SEED_NEW_PATIENT.lastName,
    );
    expect(known).toBe(false);
    expect(parseDob(SEED_NEW_PATIENT.dob)).not.toBeNull();
  });

  it('offers five relationships, ending with a free-text "Other"', () => {
    expect(RELATIONSHIPS.map((item) => en[item.label])).toEqual([
      'Daughter or son',
      'Spouse or partner',
      'Parent',
      'Legal guardian or representative',
      'Other',
    ]);
  });
});
