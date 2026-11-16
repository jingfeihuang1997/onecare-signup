import { translate, type Translate } from '../i18n';
import type { SectionId } from '../types';
import { emptyState, referenceState } from '../test/fixtures';
import { patientCallName, sectionSummary } from './summaries';

const t: Translate = (key, vars) => translate('en', key, vars);
const summary = (state: ReturnType<typeof referenceState>, section: SectionId) =>
  sectionSummary(state, section, t, 'en');

describe('section summaries', () => {
  it('match the folded panels of the reference scenario', () => {
    const state = referenceState();
    expect(summary(state, 'patient')).toBe('Maria Lopez · Apr 12, 1954');
    expect(summary(state, 'helper')).toBe('Ana Lopez · Daughter or son · (313) 555-0142');
    expect(summary(state, 'vaccines')).toBe('Flu (Fluzone High-Dose) · COVID-19 (Spikevax) · RSV');
    expect(summary(state, 'insurance')).toBe('Medicare · number added');
    expect(summary(state, 'extras')).toBe('Health questions answered · Address added');
    expect(summary(state, 'sign')).toBe('Check, then sign to finish');
  });

  it('say what each section is for while it is empty', () => {
    const state = emptyState({ forWhom: 'other' });
    expect(summary(state, 'patient')).toBe('Name and date of birth');
    expect(summary(state, 'helper')).toBe('Because you are signing up for someone else');
    expect(summary(state, 'vaccines')).toBe('Pick the vaccines');
    expect(summary(state, 'insurance')).toBe('Photo of the card, or type it in');
    expect(summary(state, 'extras')).toBe('Health questions, address, reminders');
    expect(summary(state, 'sign')).toBe('Check, then sign to finish');
  });

  it('uses the preferred name when the person gave one', () => {
    const state = referenceState();
    state.draft.helper = emptyState().draft.helper;
    expect(summary(state, 'helper')).toBe('Because you are signing up for Maria');
    state.draft.patient.preferredName = 'Mari';
    expect(patientCallName(state.draft)).toBe('Mari');
    expect(summary(state, 'helper')).toBe('Because you are signing up for Mari');
  });

  it('shows a typed relationship as typed', () => {
    const state = referenceState();
    state.draft.helper = { ...state.draft.helper, relationship: 'other', relationshipOther: 'Neighbor' };
    expect(summary(state, 'helper')).toBe('Ana Lopez · Neighbor · (313) 555-0142');
  });

  it('vaccines: no product in brackets for "no preference", and a line for "not sure"', () => {
    const state = referenceState();
    state.draft.vaccines.selections = [
      { vaccineId: 'covid', product: { kind: 'askPharmacist' }, keptAfterWarning: false },
      { vaccineId: 'flu', product: { kind: 'noPreference' }, keptAfterWarning: false },
    ];
    expect(summary(state, 'vaccines')).toBe('Flu · COVID-19');

    state.draft.vaccines = { selections: [], notSure: true };
    expect(summary(state, 'vaccines')).toBe('Not sure yet. The pharmacist will go through it.');
  });

  it('insurance: none, not sure, typed, and photos', () => {
    const state = referenceState();
    const blank = emptyState().draft.insurance;

    state.draft.insurance = { ...blank, has: 'no' };
    expect(summary(state, 'insurance')).toBe('No insurance');

    state.draft.insurance = { ...blank, has: 'notSure' };
    expect(summary(state, 'insurance')).toBe('Not sure. The pharmacist will check at the clinic.');

    state.draft.insurance = { ...blank, has: 'yes', entry: 'manual', kind: 'medicare', medicareNumber: '1EG4-TE5-MK73' };
    expect(summary(state, 'insurance')).toBe('Medicare · number added');

    state.draft.insurance = {
      ...blank,
      has: 'yes',
      kind: 'other',
      entry: 'manual',
      card: { ...blank.card, company: 'Sample Health Plan', memberId: 'SMP000123456' },
    };
    expect(summary(state, 'insurance')).toBe('Sample Health Plan · typed in');

    state.draft.insurance = { ...blank, has: 'yes', frontImage: 'data:front' };
    expect(summary(state, 'insurance')).toBe('Insurance · one photo added');
    state.draft.insurance.backImage = 'data:back';
    state.draft.insurance.card.company = 'Sample Health Plan';
    expect(summary(state, 'insurance')).toBe('Sample Health Plan · front and back photos added');
  });

  it('extras: skipped, and everything added', () => {
    const state = referenceState();
    state.draft.extras = { ...emptyState().draft.extras, skipped: true };
    expect(summary(state, 'extras')).toBe('Skipped for now');

    state.draft.extras = {
      ...referenceState().draft.extras,
      phone: '(313) 555-0199',
      remindByEmail: true,
      race: 'prefer-not',
    };
    expect(summary(state, 'extras')).toBe(
      'Health questions answered · Address added · Phone added · Reminder added · Race added',
    );
  });

  it('sign: names the signer once signed', () => {
    const state = referenceState();
    state.draft.signature = {
      signerName: 'Ana Lopez',
      signerRole: 'helper',
      method: 'typed',
      drawing: null,
      signedAt: '2026-11-14T12:00:00.000Z',
      consentVersion: 'draft-2026-11',
      userAgent: 'test',
    };
    expect(summary(state, 'sign')).toBe('Signed by Ana Lopez');
  });

  it('follows the language for dates and wording', () => {
    const state = referenceState();
    const es: Translate = (key, vars) => translate('es', key, vars);
    expect(sectionSummary(state, 'patient', es, 'es')).toMatch(/^Maria Lopez · 12 abr.* 1954$/);
  });
});
