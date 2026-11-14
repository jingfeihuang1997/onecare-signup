import { getVaccine } from '../data/vaccines';
import { emptyState, referenceState, stateBornOn, testConfig } from '../test/fixtures';
import {
  canSubmit,
  defaultProductChoice,
  fieldRules,
  hasHelper,
  insuranceKinds,
  isSectionComplete,
  isSectionValid,
  missingSections,
  nextSection,
  orderedProducts,
  patientAge,
  sectionList,
  showsProductChoice,
  stillOpen,
  vaccineList,
} from './selectors';

// The seed clinic is on Dec 1, 2026. Age is counted on that day (SPEC 10.2).
const NOW = new Date(2026, 10, 14);

describe('age rules', () => {
  it('counts age on the clinic date', () => {
    expect(patientAge(stateBornOn({ month: '04', day: '12', year: '1954' }))).toBe(72);
    expect(patientAge(stateBornOn({ month: '12', day: '01', year: '2008' }))).toBe(18);
    expect(patientAge(stateBornOn({ month: '12', day: '02', year: '2008' }))).toBe(17);
  });

  it('is unknown without a real date of birth, or for a date after the clinic', () => {
    expect(patientAge(emptyState())).toBeNull();
    expect(patientAge(stateBornOn({ month: '02', day: '30', year: '1990' }))).toBeNull();
    expect(patientAge(stateBornOn({ month: '01', day: '01', year: '2030' }))).toBeNull();
    expect(fieldRules(emptyState())).toEqual({ age: null, requiresHelper: false, showMedicare: false });
  });

  it('at 17 the patient needs a helper', () => {
    const state = stateBornOn({ month: '12', day: '02', year: '2008' }, 'self');
    expect(fieldRules(state)).toEqual({ age: 17, requiresHelper: true, showMedicare: false });
    // "Myself" was chosen, but an under-18 patient cannot sign up alone.
    expect(hasHelper(state)).toBe(true);
    expect(sectionList(state)).toContain('helper');
  });

  it('at 18 the patient can sign up alone', () => {
    const state = stateBornOn({ month: '12', day: '01', year: '2008' }, 'self');
    expect(fieldRules(state)).toEqual({ age: 18, requiresHelper: false, showMedicare: false });
    expect(hasHelper(state)).toBe(false);
  });

  it('at 64 Medicare is not offered', () => {
    const state = stateBornOn({ month: '12', day: '02', year: '1961' });
    expect(fieldRules(state)).toEqual({ age: 64, requiresHelper: false, showMedicare: false });
    expect(insuranceKinds(state)).toEqual(['other', 'none']);
  });

  it('at 65 Medicare number and last 4 of SSN are offered', () => {
    const state = stateBornOn({ month: '12', day: '01', year: '1961' });
    expect(fieldRules(state)).toEqual({ age: 65, requiresHelper: false, showMedicare: true });
    expect(insuranceKinds(state)).toEqual(['medicare', 'other', 'none']);
  });
});

describe('sections', () => {
  it('"Myself" has five sections, with no "Your details"', () => {
    const state = stateBornOn({ month: '09', day: '23', year: '1988' }, 'self');
    expect(sectionList(state)).toEqual(['patient', 'vaccines', 'insurance', 'extras', 'sign']);
    expect(nextSection(state, 'patient')).toBe('vaccines');
  });

  it('"Someone else" has six, with "Your details" right after Patient', () => {
    const state = referenceState();
    expect(sectionList(state)).toEqual(['patient', 'helper', 'vaccines', 'insurance', 'extras', 'sign']);
    expect(nextSection(state, 'patient')).toBe('helper');
    expect(nextSection(state, 'sign')).toBeNull();
  });

  it('the reference scenario is complete up to Sign and can be submitted', () => {
    const state = referenceState();
    for (const section of ['patient', 'helper', 'vaccines', 'insurance', 'extras'] as const) {
      expect(isSectionComplete(state, section, testConfig, NOW)).toBe(true);
    }
    expect(isSectionComplete(state, 'sign', testConfig, NOW)).toBe(false);
    expect(missingSections(state, testConfig, NOW)).toEqual([]);
    expect(canSubmit(state, testConfig, NOW)).toBe(true);
  });

  it('a valid section is not complete until the person has moved on from it', () => {
    const state = referenceState();
    state.draft.confirmed = ['patient'];
    expect(isSectionValid(state, 'vaccines', testConfig, NOW)).toBe(true);
    expect(isSectionComplete(state, 'vaccines', testConfig, NOW)).toBe(false);
  });

  it('Patient needs both names, a real past date of birth and a finished lookup', () => {
    const state = referenceState();
    expect(isSectionValid(state, 'patient', testConfig, NOW)).toBe(true);

    state.draft.lookup = { ...state.draft.lookup, confirmed: false };
    expect(isSectionValid(state, 'patient', testConfig, NOW)).toBe(false);

    state.draft.lookup = { status: 'notFound', record: null, confirmed: false };
    expect(isSectionValid(state, 'patient', testConfig, NOW)).toBe(true);

    state.draft.patient.dob = { month: '11', day: '15', year: '2026' };
    expect(isSectionValid(state, 'patient', testConfig, NOW)).toBe(false);

    state.draft.patient.dob = { month: '04', day: '12', year: '1954' };
    state.draft.patient.lastName = '  ';
    expect(isSectionValid(state, 'patient', testConfig, NOW)).toBe(false);
  });

  it('"Your details" accepts a typed relationship for "Other"', () => {
    const state = referenceState();
    state.draft.helper = { ...state.draft.helper, relationship: 'other', relationshipOther: '' };
    expect(isSectionValid(state, 'helper', testConfig, NOW)).toBe(false);
    state.draft.helper.relationshipOther = 'Neighbor';
    expect(isSectionValid(state, 'helper', testConfig, NOW)).toBe(true);
    state.draft.helper.email = 'ana.lopez@';
    expect(isSectionValid(state, 'helper', testConfig, NOW)).toBe(false);
  });

  it('Vaccines needs at least one vaccine, or "not sure"', () => {
    const state = referenceState();
    state.draft.vaccines = { selections: [], notSure: false };
    expect(isSectionValid(state, 'vaccines', testConfig, NOW)).toBe(false);
    expect(missingSections(state, testConfig, NOW)).toEqual(['vaccines']);
    expect(canSubmit(state, testConfig, NOW)).toBe(false);
    state.draft.vaccines.notSure = true;
    expect(isSectionValid(state, 'vaccines', testConfig, NOW)).toBe(true);
  });

  it('Insurance passes with "no insurance", with both photos, or with every field typed', () => {
    const state = referenceState();
    const blank = emptyState().draft.insurance;

    state.draft.insurance = { ...blank };
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(false);

    state.draft.insurance = { ...blank, kind: 'none' };
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(true);

    state.draft.insurance = { ...blank, kind: 'medicare', medicareNumber: '1EG4-TE5-MK73' };
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(false);
    state.draft.insurance.ssnLast4 = '6789';
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(true);

    state.draft.insurance = { ...blank, kind: 'other', frontImage: 'data:front' };
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(false);
    state.draft.insurance.backImage = 'data:back';
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(true);

    state.draft.insurance = {
      ...blank,
      kind: 'other',
      card: { company: 'A', planName: 'B', bin: '1', pcn: '2', memberId: '3', groupId: '' },
    };
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(false);
    state.draft.insurance.card.groupId = '4';
    expect(isSectionValid(state, 'insurance', testConfig, NOW)).toBe(true);
  });

  it('Insurance is not required when the config flag is off', () => {
    const state = referenceState();
    state.draft.insurance = { ...emptyState().draft.insurance };
    expect(isSectionValid(state, 'insurance', { ...testConfig, insuranceRequired: false }, NOW)).toBe(true);
  });

  it('Sign needs a signer, a signature and both consents', () => {
    const state = referenceState();
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(true);

    state.draft.sign.pharmacyConsent = false;
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(false);
    state.draft.sign.pharmacyConsent = true;

    state.draft.sign.agreeTyped = false;
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(false);

    state.draft.sign = { ...state.draft.sign, method: 'drawn', drawing: null };
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(false);
    state.draft.sign.drawing = 'data:image/png;base64,DRAWN';
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(true);
  });

  it('a patient under 18 cannot be the signer', () => {
    const state = referenceState();
    state.draft.patient.dob = { month: '06', day: '01', year: '2015' };
    state.draft.sign.signerRole = 'patient';
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(false);
    state.draft.sign.signerRole = 'helper';
    expect(isSectionValid(state, 'sign', testConfig, NOW)).toBe(true);
  });
});

describe('vaccine list', () => {
  it('shows all 16 vaccines, ordered as A05: due, then had, then no record', () => {
    const list = vaccineList(referenceState());
    expect(list.rows.map((row) => row.vaccine.id)).toEqual([
      'flu', 'covid',
      'rsv', 'tdap', 'shingles', 'pneumococcal',
      'hepb', 'hepa', 'mmr', 'varicella', 'polio', 'menacwy', 'dtap', 'hib', 'rotavirus', 'hpv',
    ]);
    expect(list.rows.map((row) => row.status.status)).toEqual([
      'due', 'due', 'had', 'had', 'had', 'had',
      'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none',
    ]);
  });

  it('hides nothing by age, and marks the rows the age rules single out', () => {
    const outside = (state: ReturnType<typeof referenceState>) =>
      vaccineList(state)
        .rows.filter((row) => !row.fitsAge)
        .map((row) => row.vaccine.id);
    expect(outside(referenceState())).toEqual(['dtap', 'hib', 'rotavirus', 'hpv']);
  });

  it('carries the selection of each row', () => {
    const list = vaccineList(referenceState());
    expect(list.rows.find((row) => row.vaccine.id === 'flu')?.selection?.product).toEqual({
      kind: 'product',
      productId: 'fluzone-hd',
    });
    expect(list.rows.find((row) => row.vaccine.id === 'tdap')?.selection).toBeNull();
  });

  it('applies the age rules it is given', () => {
    const child = stateBornOn({ month: '06', day: '01', year: '2023' }, 'other');
    const rows = vaccineList(child).rows;
    expect(rows).toHaveLength(16);
    expect(rows.filter((row) => !row.fitsAge).map((row) => row.vaccine.id)).toEqual([
      'rsv', 'tdap', 'shingles', 'rotavirus', 'hpv',
    ]);
    expect(vaccineList(referenceState(), {}).rows.every((row) => row.fitsAge)).toBe(true);
  });

  it('shows only what the clinic offers, and hides nothing while the age is unknown', () => {
    const state = emptyState();
    expect(vaccineList(state).rows).toHaveLength(16);
    expect(vaccineList(state).rows.every((row) => row.fitsAge)).toBe(true);

    state.clinic = state.clinic && { ...state.clinic, offeredVaccines: ['covid', 'flu', 'hpv'] };
    expect(vaccineList(state).rows.map((row) => row.vaccine.id)).toEqual(['flu', 'covid', 'hpv']);
    expect(vaccineList({ ...state, clinic: null }).rows).toEqual([]);
  });

  it('preselects the product the patient had before and lists it first', () => {
    const state = referenceState();
    const covid = getVaccine('covid');
    const hadComirnaty = { vaccineId: 'covid' as const, status: 'due' as const, lastDate: '2025-10-14', lastProductId: 'comirnaty' };
    expect(defaultProductChoice(covid, hadComirnaty, state.clinic)).toEqual({ kind: 'product', productId: 'comirnaty' });
    expect(orderedProducts(covid, hadComirnaty).map((product) => product.id)).toEqual([
      'comirnaty', 'spikevax', 'nuvaxovid',
    ]);

    const noHistory = { ...hadComirnaty, lastProductId: null };
    expect(defaultProductChoice(covid, noHistory, state.clinic)).toBeNull();
  });

  it('product choice is a clinic setting that defaults from the pharmacy', () => {
    const { clinic } = referenceState();
    if (!clinic) throw new Error('fixture has a clinic');
    expect(showsProductChoice(clinic)).toBe(true);
    expect(showsProductChoice({ ...clinic, productChoice: false })).toBe(false);
    expect(showsProductChoice({ ...clinic, pharmacy: { ...clinic.pharmacy, productChoice: false } })).toBe(false);
    expect(showsProductChoice({ ...clinic, productChoice: true, pharmacy: { ...clinic.pharmacy, productChoice: false } })).toBe(true);
    expect(showsProductChoice(null)).toBe(false);

    const off = { ...clinic, productChoice: false };
    const status = { vaccineId: 'flu' as const, status: 'due' as const, lastDate: null, lastProductId: 'fluzone-hd' };
    expect(defaultProductChoice(getVaccine('flu'), status, off)).toBeNull();
  });
});

describe('still open', () => {
  it('lists every optional sub-panel that was not filled in', () => {
    expect(stillOpen(emptyState())).toEqual(['health', 'more', 'address', 'reminders']);
    // Reference scenario: health questions answered and address added.
    expect(stillOpen(referenceState())).toEqual(['more', 'reminders']);
  });
});
