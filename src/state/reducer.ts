import type {
  CardFieldName,
  CardFields,
  Clinic,
  Extras,
  HealthAnswer,
  Helper,
  Insurance,
  LookupResult,
  Patient,
  ProductChoice,
  SectionId,
  SignState,
  Signature,
  SignupDraft,
  VaccineId,
  VaccineStatus,
} from '../types';
import { createEmptyDraft, type SignupState } from './draft';
import { nextSection } from './selectors';

export type SignupAction =
  | { type: 'clinic/loaded'; clinic: Clinic }
  | { type: 'start/choose'; forWhom: 'self' | 'other' }
  | { type: 'patient/update'; patch: Partial<Omit<Patient, 'recordId'>> }
  | { type: 'lookup/result'; result: LookupResult; statuses: VaccineStatus[] }
  | { type: 'lookup/confirm' }
  | { type: 'lookup/reject' }
  | { type: 'helper/update'; patch: Partial<Helper> }
  | { type: 'vaccines/select'; vaccineId: VaccineId; selected: boolean; product?: ProductChoice | null }
  | { type: 'vaccines/product'; vaccineId: VaccineId; product: ProductChoice | null }
  | { type: 'vaccines/keep'; vaccineId: VaccineId }
  | { type: 'vaccines/notSure'; notSure: boolean }
  | { type: 'insurance/update'; patch: Partial<Omit<Insurance, 'card'>> }
  | { type: 'insurance/card'; patch: Partial<CardFields> }
  | { type: 'insurance/check'; add?: readonly CardFieldName[]; remove?: readonly CardFieldName[] }
  | { type: 'extras/update'; patch: Partial<Omit<Extras, 'health' | 'skipped'>> }
  | { type: 'extras/answer'; index: number; answer: HealthAnswer }
  | { type: 'extras/saveHealth'; answers?: readonly HealthAnswer[] }
  | { type: 'extras/skip' }
  | { type: 'sign/update'; patch: Partial<SignState> }
  | { type: 'section/open'; section: SectionId }
  | { type: 'section/continue'; section: SectionId }
  | { type: 'submitted'; signature: Signature; confirmationId: string }
  | { type: 'draft/restore'; draft: SignupDraft }
  | { type: 'draft/another'; id?: string }
  | { type: 'draft/reset' };

function withDraft(state: SignupState, patch: Partial<SignupDraft>): SignupState {
  return { ...state, draft: { ...state.draft, ...patch } };
}

function without<T>(list: readonly T[], item: T): T[] {
  return list.filter((entry) => entry !== item);
}

/** The lookup depends on these, so changing one of them means it has to run again. */
function changesIdentity(patient: Patient, patch: Partial<Patient>): boolean {
  const dob = patch.dob;
  return (
    (patch.firstName !== undefined && patch.firstName !== patient.firstName) ||
    (patch.lastName !== undefined && patch.lastName !== patient.lastName) ||
    (dob !== undefined &&
      (dob.month !== patient.dob.month || dob.day !== patient.dob.day || dob.year !== patient.dob.year))
  );
}

export function signupReducer(state: SignupState, action: SignupAction): SignupState {
  const { draft } = state;
  switch (action.type) {
    case 'clinic/loaded':
      return { ...state, clinic: action.clinic };

    case 'start/choose':
      return withDraft(state, { forWhom: action.forWhom, currentSection: 'patient' });

    case 'patient/update': {
      const patient = { ...draft.patient, ...action.patch };
      if (!changesIdentity(draft.patient, action.patch)) return withDraft(state, { patient });
      // A different person: forget the record, its vaccine history and its address on file.
      return {
        ...state,
        statuses: [],
        draft: {
          ...draft,
          patient: { ...patient, recordId: null },
          lookup: { status: 'idle', record: null, confirmed: false },
          extras:
            draft.extras.address?.kind === 'onFile'
              ? { ...draft.extras, address: null }
              : draft.extras,
          confirmed: without(draft.confirmed, 'patient'),
        },
      };
    }

    case 'lookup/result':
      return {
        ...state,
        statuses: action.statuses,
        draft: {
          ...draft,
          lookup: {
            status: action.result.found ? 'found' : 'notFound',
            record: action.result.maskedRecord,
            confirmed: false,
          },
        },
      };

    case 'lookup/confirm': {
      const record = draft.lookup.record;
      if (draft.lookup.status !== 'found' || !record) return state;
      // A found record prefills the home address only (SPEC 10.2).
      const address =
        draft.extras.address ??
        (record.address ? { kind: 'onFile' as const, masked: record.address } : null);
      return withDraft(state, {
        patient: { ...draft.patient, recordId: record.patientId },
        lookup: { ...draft.lookup, confirmed: true },
        extras: { ...draft.extras, address },
      });
    }

    case 'lookup/reject': {
      // "This is not Maria": back to empty fields.
      const empty = createEmptyDraft(draft.clinicToken, draft.id);
      return {
        ...state,
        statuses: [],
        draft: {
          ...draft,
          patient: empty.patient,
          lookup: empty.lookup,
          vaccines: empty.vaccines,
          extras:
            draft.extras.address?.kind === 'onFile'
              ? { ...draft.extras, address: null }
              : draft.extras,
          confirmed: without(draft.confirmed, 'patient'),
        },
      };
    }

    case 'helper/update':
      return withDraft(state, { helper: { ...draft.helper, ...action.patch } });

    case 'vaccines/select': {
      const others = draft.vaccines.selections.filter(
        (selection) => selection.vaccineId !== action.vaccineId,
      );
      const selections = action.selected
        ? [
            ...others,
            { vaccineId: action.vaccineId, product: action.product ?? null, keptAfterWarning: false },
          ]
        : others;
      return withDraft(state, { vaccines: { ...draft.vaccines, selections } });
    }

    case 'vaccines/product':
      return withDraft(state, {
        vaccines: {
          ...draft.vaccines,
          selections: draft.vaccines.selections.map((selection) =>
            selection.vaccineId === action.vaccineId
              ? { ...selection, product: action.product }
              : selection,
          ),
        },
      });

    case 'vaccines/keep':
      return withDraft(state, {
        vaccines: {
          ...draft.vaccines,
          selections: draft.vaccines.selections.map((selection) =>
            selection.vaccineId === action.vaccineId
              ? { ...selection, keptAfterWarning: true }
              : selection,
          ),
        },
      });

    case 'vaccines/notSure':
      // "Not sure" clears nothing: it is sent along with any selections.
      return withDraft(state, { vaccines: { ...draft.vaccines, notSure: action.notSure } });

    case 'insurance/update':
      return withDraft(state, { insurance: { ...draft.insurance, ...action.patch } });

    case 'insurance/card':
      return withDraft(state, {
        insurance: { ...draft.insurance, card: { ...draft.insurance.card, ...action.patch } },
      });

    case 'insurance/check': {
      // Merged here, not by the caller: two card readings can finish one after the other.
      const kept = draft.insurance.checkFields.filter((field) => !action.remove?.includes(field));
      const checkFields = [...new Set([...kept, ...(action.add ?? [])])];
      return withDraft(state, { insurance: { ...draft.insurance, checkFields } });
    }

    case 'extras/update':
      return withDraft(state, { extras: { ...draft.extras, ...action.patch } });

    case 'extras/answer': {
      if (action.index < 0 || action.index >= draft.extras.health.answers.length) return state;
      const answers = draft.extras.health.answers.map((answer, index) =>
        index === action.index ? action.answer : answer,
      );
      return withDraft(state, {
        extras: { ...draft.extras, health: { ...draft.extras.health, answers } },
      });
    }

    case 'extras/saveHealth': {
      // The answers given, where there is one per question; else the ones already in the draft.
      const answers =
        action.answers && action.answers.length === draft.extras.health.answers.length
          ? [...action.answers]
          : draft.extras.health.answers;
      return withDraft(state, { extras: { ...draft.extras, health: { saved: true, answers } } });
    }

    case 'extras/skip':
      return withDraft(state, {
        extras: { ...draft.extras, skipped: true },
        confirmed: [...without(draft.confirmed, 'extras'), 'extras'],
        currentSection: nextSection(state, 'extras') ?? draft.currentSection,
      });

    case 'sign/update':
      return withDraft(state, { sign: { ...draft.sign, ...action.patch } });

    case 'section/open':
      return withDraft(state, { currentSection: action.section });

    case 'section/continue':
      return withDraft(state, {
        confirmed: [...without(draft.confirmed, action.section), action.section],
        currentSection: nextSection(state, action.section) ?? draft.currentSection,
        extras:
          action.section === 'extras' ? { ...draft.extras, skipped: false } : draft.extras,
      });

    case 'submitted':
      return withDraft(state, {
        signature: action.signature,
        confirmationId: action.confirmationId,
        confirmed: [...without(draft.confirmed, 'sign'), 'sign'],
        currentSection: 'done',
      });

    case 'draft/restore':
      return { ...state, statuses: [], draft: action.draft };

    case 'draft/another': {
      // "Sign up another person": back to Start, helper details kept (SPEC 5.5).
      const fresh = createEmptyDraft(draft.clinicToken, action.id);
      return { ...state, statuses: [], draft: { ...fresh, helper: draft.helper } };
    }

    case 'draft/reset':
      // "Forget what is saved on this phone": nothing is kept, the helper included.
      return { ...state, statuses: [], draft: createEmptyDraft(draft.clinicToken) };
  }
}
