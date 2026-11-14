import { LANGUAGES, type Language } from '../i18n';
import type {
  DateOfBirth,
  DraftPosition,
  EnteredAddress,
  Helper,
  ProductChoice,
  RelationshipId,
  SectionId,
  SignupDraft,
  VaccineId,
  VaccineSelection,
} from '../types';
import { VACCINE_IDS } from '../data/vaccines';
import { createEmptyDraft } from './draft';

// Device memory (SPEC section 6): one localStorage key holding JSON.
//
// The rule that matters most: nothing on the "Never store" list may reach the device.
// So this file never copies a draft, or any part of it, wholesale. Every stored object is
// built field by field from the allow-list below, and what is read back goes through the
// same field-by-field functions. A field that is not named here cannot be stored.
//
// May store:   language, text size, helper details, and per patient: first name, last name,
//              preferred name, date of birth, vaccine selections, current section,
//              home address, reminder phone and email.
// Never store: last 4 of SSN, Medicare number, any insurance ID, card images,
//              health answers, sex, race, signature.

export const STORAGE_KEY = 'onecare.signup.v1';
export const MAX_AGE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const POSITIONS: readonly DraftPosition[] = [
  'start',
  'patient',
  'helper',
  'vaccines',
  'insurance',
  'extras',
  'sign',
  'done',
];
/** After a restore only these can still be done: the others lost their never-stored content. */
const RESTORABLE_SECTIONS: readonly SectionId[] = ['patient', 'helper', 'vaccines'];
const SECTION_IDS: readonly SectionId[] = ['patient', 'helper', 'vaccines', 'insurance', 'extras', 'sign'];
const RELATIONSHIP_IDS: readonly RelationshipId[] = ['child', 'spouse', 'parent', 'guardian', 'other'];

export interface StoredPrefs {
  language?: Language;
  /** Index into TEXT_SIZE_STEPS. */
  textSizeStep?: number;
}

export interface StoredHelper extends Helper {
  /** ISO timestamp of the last save. */
  savedAt: string;
}

export interface StoredPatient {
  /** The draft's random id. */
  id: string;
  savedAt: string;
  clinicToken: string;
  forWhom: 'self' | 'other';
  /** True once this sign-up was sent. A sent sign-up is not offered under "Welcome back". */
  submitted: boolean;
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: DateOfBirth;
  vaccines: { selections: VaccineSelection[]; notSure: boolean };
  currentSection: DraftPosition;
  /** Sections finished so far. Progress only, like the current section: no content. */
  confirmed: SectionId[];
  address: EnteredAddress | null;
  reminderPhone: string;
  reminderEmail: string;
}

export interface DeviceMemoryData {
  version: 1;
  prefs: StoredPrefs;
  helper: StoredHelper | null;
  patients: StoredPatient[];
}

export interface DeviceMemory {
  /** Whether drafts and helper details are kept. Preferences are kept either way. */
  readonly enabled: boolean;
  /** Never throws. Expired entries are left out. */
  read(): DeviceMemoryData;
  savePrefs(prefs: StoredPrefs): void;
  saveDraft(draft: SignupDraft): void;
  /** "Forget what is saved on this phone": deletes the key. */
  forget(): void;
}

interface Options {
  /** The config flag (SPEC 6). When false, only language and text size are stored. */
  enabled: boolean;
  /** Defaults to window.localStorage. Pass null to run with no storage at all. */
  storage?: Storage | null;
  now?: () => Date;
}

// --- Reading unknown JSON, one allowed field at a time ---------------------

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.find((item) => item === value) ?? null;
}

function pickDob(value: unknown): DateOfBirth {
  const source = isObject(value) ? value : {};
  return { month: text(source.month), day: text(source.day), year: text(source.year) };
}

function pickProduct(value: unknown): ProductChoice | null {
  if (!isObject(value)) return null;
  if (value.kind === 'product' && typeof value.productId === 'string') {
    return { kind: 'product', productId: value.productId };
  }
  if (value.kind === 'noPreference' || value.kind === 'askPharmacist') return { kind: value.kind };
  return null;
}

function pickSelections(value: unknown): VaccineSelection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): VaccineSelection[] => {
    const vaccineId = isObject(item) ? oneOf<VaccineId>(item.vaccineId, VACCINE_IDS) : null;
    if (!isObject(item) || !vaccineId) return [];
    return [
      {
        vaccineId,
        product: pickProduct(item.product),
        keptAfterWarning: item.keptAfterWarning === true,
      },
    ];
  });
}

function pickSections(value: unknown): SectionId[] {
  if (!Array.isArray(value)) return [];
  return SECTION_IDS.filter((section) => value.includes(section));
}

function pickAddress(value: unknown): EnteredAddress | null {
  // Only an address the person typed is stored. An address "on file" stays with the pharmacy.
  if (!isObject(value) || value.kind !== 'entered') return null;
  return {
    kind: 'entered',
    street: text(value.street),
    unit: text(value.unit),
    city: text(value.city),
    state: text(value.state),
    zip: text(value.zip),
  };
}

function pickHelper(value: unknown): StoredHelper | null {
  if (!isObject(value) || typeof value.savedAt !== 'string') return null;
  return {
    savedAt: value.savedAt,
    firstName: text(value.firstName),
    lastName: text(value.lastName),
    relationship: oneOf(value.relationship, RELATIONSHIP_IDS),
    relationshipOther: text(value.relationshipOther),
    phone: text(value.phone),
    email: text(value.email),
  };
}

function pickPatient(value: unknown): StoredPatient | null {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.savedAt !== 'string') {
    return null;
  }
  const vaccines = isObject(value.vaccines) ? value.vaccines : {};
  return {
    id: value.id,
    savedAt: value.savedAt,
    clinicToken: text(value.clinicToken),
    forWhom: value.forWhom === 'self' ? 'self' : 'other',
    submitted: value.submitted === true,
    firstName: text(value.firstName),
    lastName: text(value.lastName),
    preferredName: text(value.preferredName),
    dob: pickDob(value.dob),
    vaccines: { selections: pickSelections(vaccines.selections), notSure: vaccines.notSure === true },
    currentSection: oneOf(value.currentSection, POSITIONS) ?? 'start',
    confirmed: pickSections(value.confirmed),
    address: pickAddress(value.address),
    reminderPhone: text(value.reminderPhone),
    reminderEmail: text(value.reminderEmail),
  };
}

function pickPrefs(value: unknown): StoredPrefs {
  const source = isObject(value) ? value : {};
  const prefs: StoredPrefs = {};
  const language = oneOf(source.language, LANGUAGES);
  if (language) prefs.language = language;
  if (typeof source.textSizeStep === 'number' && Number.isInteger(source.textSizeStep)) {
    prefs.textSizeStep = source.textSizeStep;
  }
  return prefs;
}

// --- Building what is stored from a draft: the allow-list ------------------

function storedHelper(helper: Helper, savedAt: string): StoredHelper {
  return {
    savedAt,
    firstName: helper.firstName,
    lastName: helper.lastName,
    relationship: helper.relationship,
    relationshipOther: helper.relationshipOther,
    phone: helper.phone,
    email: helper.email,
  };
}

function storedPatient(draft: SignupDraft, savedAt: string): StoredPatient {
  return {
    id: draft.id,
    savedAt,
    clinicToken: draft.clinicToken,
    forWhom: draft.forWhom === 'self' ? 'self' : 'other',
    submitted: draft.confirmationId !== null,
    firstName: draft.patient.firstName,
    lastName: draft.patient.lastName,
    preferredName: draft.patient.preferredName,
    dob: pickDob(draft.patient.dob),
    vaccines: {
      selections: pickSelections(draft.vaccines.selections),
      notSure: draft.vaccines.notSure,
    },
    currentSection: draft.currentSection,
    confirmed: pickSections(draft.confirmed),
    address: pickAddress(draft.extras.address),
    reminderPhone: draft.extras.reminderPhone,
    reminderEmail: draft.extras.reminderEmail,
  };
}

function hasText(...values: string[]): boolean {
  return values.some((value) => value.trim() !== '');
}

/**
 * Rebuilds a draft from a stored entry, to continue it. Everything on the "Never store"
 * list starts empty again, and the record lookup has to run again.
 */
export function draftFromStored(entry: StoredPatient, helper: StoredHelper | null): SignupDraft {
  const draft = createEmptyDraft(entry.clinicToken, entry.id);
  return {
    ...draft,
    forWhom: entry.forWhom,
    patient: {
      ...draft.patient,
      firstName: entry.firstName,
      lastName: entry.lastName,
      preferredName: entry.preferredName,
      dob: entry.dob,
    },
    helper: helper
      ? {
          firstName: helper.firstName,
          lastName: helper.lastName,
          relationship: helper.relationship,
          relationshipOther: helper.relationshipOther,
          phone: helper.phone,
          email: helper.email,
        }
      : draft.helper,
    vaccines: entry.vaccines,
    extras: {
      ...draft.extras,
      address: entry.address,
      reminderPhone: entry.reminderPhone,
      reminderEmail: entry.reminderEmail,
    },
    confirmed: entry.confirmed.filter((section) => RESTORABLE_SECTIONS.includes(section)),
    currentSection: entry.currentSection === 'done' ? 'start' : entry.currentSection,
  };
}

// --- The store -------------------------------------------------------------

function emptyData(): DeviceMemoryData {
  return { version: 1, prefs: {}, helper: null, patients: [] };
}

/** window.localStorage, or null where reading the property itself throws or it is missing. */
export function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createDeviceMemory({
  enabled,
  storage = browserStorage(),
  now = () => new Date(),
}: Options): DeviceMemory {
  const isFresh = (savedAt: string): boolean => {
    const saved = Date.parse(savedAt);
    return Number.isFinite(saved) && now().getTime() - saved <= MAX_AGE_DAYS * DAY_MS;
  };

  const read = (): DeviceMemoryData => {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (!isObject(parsed) || parsed.version !== 1) return emptyData();
      const data = emptyData();
      data.prefs = pickPrefs(parsed.prefs);
      if (!enabled) return data;
      const helper = pickHelper(parsed.helper);
      data.helper = helper && isFresh(helper.savedAt) ? helper : null;
      data.patients = (Array.isArray(parsed.patients) ? parsed.patients : [])
        .map(pickPatient)
        .filter((entry): entry is StoredPatient => entry !== null && isFresh(entry.savedAt));
      return data;
    } catch {
      // Storage blocked, full, or holding something that is not ours: carry on without it.
      return emptyData();
    }
  };

  const write = (data: DeviceMemoryData): void => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // The app must work without device memory.
    }
  };

  return {
    enabled,
    read,

    savePrefs(prefs) {
      const data = read();
      write({ ...data, prefs: pickPrefs({ ...data.prefs, ...prefs }) });
    },

    saveDraft(draft) {
      if (!enabled) return;
      // A draft counts as started once the person has said who it is for.
      const hasPatient =
        draft.forWhom !== null || hasText(draft.patient.firstName, draft.patient.lastName);
      const hasHelper = hasText(draft.helper.firstName, draft.helper.lastName);
      if (!hasPatient && !hasHelper) return;

      const data = read();
      const savedAt = now().toISOString();
      write({
        ...data,
        helper: hasHelper ? storedHelper(draft.helper, savedAt) : data.helper,
        patients: hasPatient
          ? [...data.patients.filter((entry) => entry.id !== draft.id), storedPatient(draft, savedAt)]
          : data.patients,
      });
    },

    forget() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to remove if storage is unavailable.
      }
    },
  };
}
