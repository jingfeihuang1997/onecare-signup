import { SEED_MARIA } from '../data/seed';
import { emptyState, fullStatuses, referenceState } from '../test/fixtures';
import { signupReducer, type SignupAction } from './reducer';
import type { SignupState } from './draft';

function run(state: SignupState, ...actions: SignupAction[]): SignupState {
  return actions.reduce(signupReducer, state);
}

const lookupFound: SignupAction = {
  type: 'lookup/result',
  result: { found: true, maskedRecord: SEED_MARIA.record },
  statuses: fullStatuses(SEED_MARIA.statuses),
};

describe('signupReducer', () => {
  it('starts on Patient once the person says who the sign-up is for', () => {
    const state = run(emptyState(), { type: 'start/choose', forWhom: 'other' });
    expect(state.draft.forWhom).toBe('other');
    expect(state.draft.currentSection).toBe('patient');
  });

  it('record found: confirming keeps the record id and prefills the address on file', () => {
    const found = run(emptyState({ forWhom: 'other' }), lookupFound);
    expect(found.draft.lookup).toMatchObject({ status: 'found', confirmed: false });
    expect(found.draft.patient.recordId).toBeNull();
    expect(found.statuses).toHaveLength(16);

    const confirmed = run(found, { type: 'lookup/confirm' });
    expect(confirmed.draft.lookup.confirmed).toBe(true);
    expect(confirmed.draft.patient.recordId).toBe(SEED_MARIA.record.patientId);
    expect(confirmed.draft.extras.address).toEqual({
      kind: 'onFile',
      masked: '•••• Maple St, Ann Arbor, MI ••104',
    });
    // Insurance on file is not prefilled (SPEC 10.2).
    expect(confirmed.draft.insurance.kind).toBeNull();
  });

  it('record not found: nothing is prefilled', () => {
    const state = run(emptyState(), {
      type: 'lookup/result',
      result: { found: false, maskedRecord: null },
      statuses: fullStatuses([]),
    });
    expect(state.draft.lookup.status).toBe('notFound');
    expect(run(state, { type: 'lookup/confirm' })).toBe(state);
  });

  it('"This is not Maria" clears the patient, the record and the vaccine picks', () => {
    const state = run(referenceState(), { type: 'lookup/reject' });
    expect(state.draft.patient).toMatchObject({ firstName: '', lastName: '', recordId: null });
    expect(state.draft.lookup.status).toBe('idle');
    expect(state.draft.vaccines.selections).toEqual([]);
    expect(state.statuses).toEqual([]);
    expect(state.draft.confirmed).not.toContain('patient');
    // The helper's own details stay.
    expect(state.draft.helper.firstName).toBe('Ana');
  });

  it('changing the name or date of birth means the lookup must run again', () => {
    const confirmed = run(emptyState({ forWhom: 'other' }), lookupFound, { type: 'lookup/confirm' });
    const renamed = run(confirmed, { type: 'patient/update', patch: { firstName: 'Marta' } });
    expect(renamed.draft.lookup.status).toBe('idle');
    expect(renamed.draft.patient.recordId).toBeNull();
    expect(renamed.draft.extras.address).toBeNull();
    expect(renamed.statuses).toEqual([]);

    // The preferred name is not part of the lookup.
    const nicknamed = run(confirmed, { type: 'patient/update', patch: { preferredName: 'Mari' } });
    expect(nicknamed.draft.lookup.confirmed).toBe(true);
    expect(nicknamed.draft.patient.preferredName).toBe('Mari');
  });

  it('vaccines: select, choose a product, keep after the warning, remove', () => {
    let state = run(
      emptyState(),
      { type: 'vaccines/select', vaccineId: 'flu', selected: true, product: { kind: 'product', productId: 'fluzone-hd' } },
      { type: 'vaccines/select', vaccineId: 'rsv', selected: true },
      { type: 'vaccines/product', vaccineId: 'flu', product: { kind: 'noPreference' } },
      { type: 'vaccines/keep', vaccineId: 'rsv' },
    );
    expect(state.draft.vaccines.selections).toEqual([
      { vaccineId: 'flu', product: { kind: 'noPreference' }, keptAfterWarning: false },
      { vaccineId: 'rsv', product: null, keptAfterWarning: true },
    ]);

    state = run(state, { type: 'vaccines/select', vaccineId: 'rsv', selected: false });
    expect(state.draft.vaccines.selections.map((item) => item.vaccineId)).toEqual(['flu']);
  });

  it('"not sure" clears nothing', () => {
    const state = run(referenceState(), { type: 'vaccines/notSure', notSure: true });
    expect(state.draft.vaccines.notSure).toBe(true);
    expect(state.draft.vaccines.selections).toHaveLength(3);
  });

  it('Continue marks the section and moves to the next one in the list', () => {
    const helperPath = run(emptyState({ forWhom: 'other' }), { type: 'section/continue', section: 'patient' });
    expect(helperPath.draft.currentSection).toBe('helper');
    expect(helperPath.draft.confirmed).toEqual(['patient']);

    const selfPath = run(emptyState({ forWhom: 'self' }), { type: 'section/continue', section: 'patient' });
    expect(selfPath.draft.currentSection).toBe('vaccines');

    const twice = run(selfPath, { type: 'section/continue', section: 'patient' });
    expect(twice.draft.confirmed).toEqual(['patient']);
  });

  it('"Skip for now" moves on to Sign and is remembered; "Continue to sign" clears it', () => {
    const skipped = run(emptyState({ forWhom: 'self' }), { type: 'extras/skip' });
    expect(skipped.draft.extras.skipped).toBe(true);
    expect(skipped.draft.confirmed).toContain('extras');
    expect(skipped.draft.currentSection).toBe('sign');

    const continued = run(skipped, { type: 'section/continue', section: 'extras' });
    expect(continued.draft.extras.skipped).toBe(false);
  });

  it('health answers start as No and count as answered only once saved', () => {
    const state = run(emptyState(), { type: 'extras/answer', index: 1, answer: 'yes' }, {
      type: 'extras/answer',
      index: 13,
      answer: 'notSure',
    });
    expect(state.draft.extras.health.answers[0]).toBe('no');
    expect(state.draft.extras.health.answers[1]).toBe('yes');
    expect(state.draft.extras.health.answers[13]).toBe('notSure');
    expect(state.draft.extras.health.saved).toBe(false);
    expect(run(state, { type: 'extras/answer', index: 14, answer: 'yes' })).toBe(state);
    expect(run(state, { type: 'extras/saveHealth' }).draft.extras.health.saved).toBe(true);
  });

  it('updates helper, insurance, card fields, extras and sign by patch', () => {
    const state = run(
      emptyState(),
      { type: 'helper/update', patch: { relationship: 'other', relationshipOther: 'Neighbor' } },
      { type: 'insurance/update', patch: { kind: 'other', entry: 'manual' } },
      { type: 'insurance/card', patch: { company: 'Sample Health Plan' } },
      { type: 'extras/update', patch: { reminderEmail: 'maria@example.com' } },
      { type: 'sign/update', patch: { pharmacyConsent: true } },
      { type: 'section/open', section: 'insurance' },
    );
    expect(state.draft.helper.relationshipOther).toBe('Neighbor');
    expect(state.draft.insurance).toMatchObject({ kind: 'other', entry: 'manual' });
    expect(state.draft.insurance.card).toMatchObject({ company: 'Sample Health Plan', memberId: '' });
    expect(state.draft.extras.reminderEmail).toBe('maria@example.com');
    expect(state.draft.sign).toMatchObject({ pharmacyConsent: true, onecareConsent: false });
    expect(state.draft.currentSection).toBe('insurance');
  });

  it('submitting stores the signature and lands on Done', () => {
    const signature = {
      signerName: 'Ana Lopez',
      signerRole: 'helper' as const,
      method: 'typed' as const,
      drawing: null,
      signedAt: '2026-11-14T12:00:00.000Z',
      consentVersion: 'draft-2026-11',
      userAgent: 'test',
    };
    const state = run(referenceState(), { type: 'submitted', signature, confirmationId: 'OC-MOCK-0001' });
    expect(state.draft.signature).toEqual(signature);
    expect(state.draft.confirmationId).toBe('OC-MOCK-0001');
    expect(state.draft.currentSection).toBe('done');
  });

  it('"Sign up another person" starts a new draft and keeps the helper details', () => {
    const before = referenceState();
    const state = run(before, { type: 'draft/another', id: 'draft-next' });
    expect(state.draft.id).toBe('draft-next');
    expect(state.draft.currentSection).toBe('start');
    expect(state.draft.forWhom).toBeNull();
    expect(state.draft.patient.firstName).toBe('');
    expect(state.draft.insurance.medicareNumber).toBe('');
    expect(state.draft.helper).toEqual(before.draft.helper);
    expect(state.clinic).toEqual(before.clinic);
  });

  it('restores a draft and loads the clinic', () => {
    const { draft, clinic } = referenceState();
    if (!clinic) throw new Error('fixture has a clinic');
    const state = run({ ...emptyState(), clinic: null }, { type: 'clinic/loaded', clinic }, {
      type: 'draft/restore',
      draft,
    });
    expect(state.clinic).toEqual(clinic);
    expect(state.draft).toBe(draft);
    expect(state.statuses).toEqual([]);
  });
});
