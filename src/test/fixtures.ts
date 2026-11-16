import { SEED_CLINIC, SEED_HELPER, SEED_MARIA } from '../data/seed';
import { VACCINE_IDS } from '../data/vaccines';
import type { AppConfig } from '../app/config';
import { defaultConfig } from '../app/config';
import { createEmptyDraft, type SignupState } from '../state/draft';
import type { DateOfBirth, SignupDraft, VaccineStatus } from '../types';

export const testConfig: AppConfig = { ...defaultConfig, mockDelayMs: 0, lookupDelayMs: 0 };

/** One status per vaccine, filling "no record" where the seed says nothing. */
export function fullStatuses(known: readonly VaccineStatus[]): VaccineStatus[] {
  return VACCINE_IDS.map(
    (vaccineId) =>
      known.find((status) => status.vaccineId === vaccineId) ?? {
        vaccineId,
        status: 'none',
        lastDate: null,
        lastProductId: null,
      },
  );
}

/** An empty draft at the seed clinic, with the clinic already loaded. */
export function emptyState(patch: Partial<SignupDraft> = {}): SignupState {
  return {
    clinic: structuredClone(SEED_CLINIC),
    statuses: [],
    draft: { ...createEmptyDraft(SEED_CLINIC.token, 'draft-test'), ...patch },
  };
}

/** A state whose patient has the given date of birth and nothing else. */
export function stateBornOn(dob: DateOfBirth, forWhom: 'self' | 'other' = 'self'): SignupState {
  const state = emptyState({ forWhom });
  state.draft.patient = { ...state.draft.patient, firstName: 'Test', lastName: 'Patient', dob };
  return state;
}

/**
 * The reference scenario, filled in up to the Sign step: Ana Lopez signing up her mother
 * Maria Lopez at Cedar Lane Pharmacy (SPEC section 8, and the folded panels of A11).
 */
export function referenceState(): SignupState {
  const draft = createEmptyDraft(SEED_CLINIC.token, 'draft-maria');
  return {
    clinic: structuredClone(SEED_CLINIC),
    statuses: fullStatuses(SEED_MARIA.statuses),
    draft: {
      ...draft,
      forWhom: 'other',
      patient: {
        recordId: SEED_MARIA.record.patientId,
        firstName: SEED_MARIA.firstName,
        lastName: SEED_MARIA.lastName,
        preferredName: '',
        dob: { ...SEED_MARIA.dob },
        sex: 'female',
        email: 'ana.lopez@example.com',
        emailOwner: null,
      },
      lookup: { status: 'found', record: structuredClone(SEED_MARIA.record), confirmed: true },
      helper: { ...SEED_HELPER },
      vaccines: {
        selections: [
          { vaccineId: 'rsv', product: null, keptAfterWarning: true },
          { vaccineId: 'flu', product: { kind: 'product', productId: 'fluzone-hd' }, keptAfterWarning: false },
          { vaccineId: 'covid', product: { kind: 'product', productId: 'spikevax' }, keptAfterWarning: false },
        ],
        notSure: false,
      },
      insurance: {
        ...draft.insurance,
        has: 'yes',
        kind: 'medicare',
        medicareNumber: '1EG4-TE5-MK73',
        ssnLast4: '6789',
        entry: 'manual',
      },
      extras: {
        ...draft.extras,
        health: { saved: true, answers: draft.extras.health.answers },
        address: {
          kind: 'entered',
          street: '1420 Maple St',
          unit: '',
          city: 'Ann Arbor',
          state: 'MI',
          zip: '48104',
        },
      },
      sign: {
        signerRole: 'helper',
        signerName: 'Ana Lopez',
        method: 'typed',
        drawing: null,
        agreeTyped: true,
        pharmacyConsent: true,
        onecareConsent: true,
      },
      confirmed: ['patient', 'helper', 'vaccines', 'insurance', 'extras'],
      currentSection: 'sign',
    },
  };
}

/** A Storage that keeps its items in memory, for device-memory tests. */
export class MemoryStorage implements Storage {
  private items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

/** A Storage where every call throws, as in some private-browsing modes. */
export class ThrowingStorage implements Storage {
  get length(): number {
    throw new Error('storage blocked');
  }

  clear(): void {
    throw new Error('storage blocked');
  }

  getItem(): string | null {
    throw new Error('storage blocked');
  }

  key(): string | null {
    throw new Error('storage blocked');
  }

  removeItem(): void {
    throw new Error('storage blocked');
  }

  setItem(): void {
    throw new Error('storage blocked');
  }
}
