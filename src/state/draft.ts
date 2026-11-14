import { defaultHealthAnswers } from '../data/healthQuestions';
import type { Clinic, Helper, SignupDraft, VaccineStatus } from '../types';

/** Everything the store holds: what was loaded for this clinic and patient, and the draft. */
export interface SignupState {
  clinic: Clinic | null;
  /** Vaccine status of the current patient. Empty until the lookup has run. */
  statuses: VaccineStatus[];
  draft: SignupDraft;
}

export function newDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyHelper(): Helper {
  return {
    firstName: '',
    lastName: '',
    relationship: null,
    relationshipOther: '',
    phone: '',
    email: '',
  };
}

export function createEmptyDraft(clinicToken: string, id: string = newDraftId()): SignupDraft {
  return {
    id,
    clinicToken,
    forWhom: null,
    patient: {
      recordId: null,
      firstName: '',
      lastName: '',
      preferredName: '',
      dob: { month: '', day: '', year: '' },
    },
    lookup: { status: 'idle', record: null, confirmed: false },
    helper: emptyHelper(),
    vaccines: { selections: [], notSure: false },
    insurance: {
      kind: null,
      medicareNumber: '',
      ssnLast4: '',
      card: { company: '', planName: '', bin: '', pcn: '', memberId: '', groupId: '' },
      frontImage: null,
      backImage: null,
      entry: null,
      checkFields: [],
    },
    extras: {
      health: { saved: false, answers: defaultHealthAnswers() },
      sex: null,
      race: null,
      address: null,
      reminderPhone: '',
      reminderEmail: '',
      skipped: false,
    },
    sign: {
      signerRole: null,
      signerName: '',
      method: 'typed',
      drawing: null,
      agreeTyped: false,
      pharmacyConsent: false,
      onecareConsent: false,
    },
    confirmed: [],
    currentSection: 'start',
    signature: null,
    confirmationId: null,
  };
}

export function createInitialState(clinicToken: string, draft?: SignupDraft): SignupState {
  return { clinic: null, statuses: [], draft: draft ?? createEmptyDraft(clinicToken) };
}
