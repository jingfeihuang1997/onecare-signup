import type { AppConfig } from '../app/config';
import { isAllowedAtAge, MOCK_AGE_RULES, type AgeRules } from '../data/ageRules';
import { getVaccine } from '../data/vaccines';
import type {
  Clinic,
  EmailOwner,
  ExtrasItem,
  ProductChoice,
  SectionId,
  Vaccine,
  VaccineId,
  VaccineProduct,
  VaccineSelection,
  VaccineStatus,
  VaccineStatusKind,
} from '../types';
import { ageOn, calendarDay, compareDates, parseDob, parseIsoDate } from './dates';
import type { SignupState } from './draft';
import { isEmail, isFilled, isMedicareNumber, isSsnLast4, isUsPhone } from './validation';

// Pure functions over the store. Sections and shells read the draft only through these,
// so option A and option B always agree.

// --- Age-based rules (SPEC 5.2) -------------------------------------------

const ADULT_AGE = 18;
const MEDICARE_AGE = 65;

/** The patient's age in whole years on the clinic date (SPEC 10.2). Null until both are known. */
export function patientAge(state: SignupState): number | null {
  const birth = parseDob(state.draft.patient.dob);
  const clinicDay = state.clinic ? parseIsoDate(state.clinic.date) : null;
  if (!birth || !clinicDay || compareDates(birth, clinicDay) > 0) return null;
  return ageOn(birth, clinicDay);
}

export interface FieldRules {
  age: number | null;
  /** Under 18: someone else must sign up for the patient, and the patient cannot sign. */
  requiresHelper: boolean;
  /** 65 and over: Medicare can be chosen when the insurance details are typed in. */
  showMedicare: boolean;
}

export function fieldRules(state: SignupState): FieldRules {
  const age = patientAge(state);
  return {
    age,
    requiresHelper: age !== null && age < ADULT_AGE,
    showMedicare: age !== null && age >= MEDICARE_AGE,
  };
}

// --- Sections (SPEC 2 and 10.1) -------------------------------------------

/** True when someone else is signing up the patient: by choice, or because the patient is under 18. */
export function hasHelper(state: SignupState): boolean {
  return state.draft.forWhom === 'other' || fieldRules(state).requiresHelper;
}

/** The sections of this sign-up, in order. "Your details" exists only on the helper path. */
export function sectionList(state: SignupState): SectionId[] {
  return hasHelper(state)
    ? ['patient', 'helper', 'vaccines', 'insurance', 'extras', 'sign']
    : ['patient', 'vaccines', 'insurance', 'extras', 'sign'];
}

export function nextSection(state: SignupState, after: SectionId): SectionId | null {
  const list = sectionList(state);
  const index = list.indexOf(after);
  return index === -1 ? null : (list[index + 1] ?? null);
}

/** Whose email the confirmation goes to. Until chosen: the person filling in the form. */
export function emailOwner(state: SignupState): EmailOwner {
  return state.draft.patient.emailOwner ?? (state.draft.forWhom === 'other' ? 'helper' : 'patient');
}

/** A phone number given earlier in the sign-up: the patient's, else the helper's. */
export function knownPhone(state: SignupState): string {
  const { extras, helper } = state.draft;
  if (isUsPhone(extras.phone)) return extras.phone.trim();
  return hasHelper(state) && isUsPhone(helper.phone) ? helper.phone.trim() : '';
}

export interface ReminderTargets {
  /** Where an email reminder goes, or null when none was asked for. */
  email: string | null;
  /** Where a text reminder goes, or null when none was asked for. */
  phone: string | null;
}

/** Reminders use what was given earlier unless a different address or number was typed. */
export function reminderTargets(state: SignupState): ReminderTargets {
  const { extras, patient } = state.draft;
  return {
    email: extras.remindByEmail ? extras.reminderEmail.trim() || patient.email.trim() : null,
    phone: extras.remindByText ? extras.reminderPhone.trim() || knownPhone(state) : null,
  };
}

/** Whether the reminders asked for can be sent. Nothing asked for is fine. */
export function remindersValid(state: SignupState): boolean {
  const targets = reminderTargets(state);
  return (
    (targets.email === null || isEmail(targets.email)) &&
    (targets.phone === null || isUsPhone(targets.phone))
  );
}

/** Whether a section's own content is filled in correctly. `now` is injectable for tests. */
export function isSectionValid(
  state: SignupState,
  section: SectionId,
  config: AppConfig,
  now: Date = new Date(),
): boolean {
  const { draft } = state;
  switch (section) {
    case 'patient': {
      const birth = parseDob(draft.patient.dob);
      const looked =
        draft.lookup.status === 'notFound' ||
        (draft.lookup.status === 'found' && draft.lookup.confirmed);
      return (
        isFilled(draft.patient.firstName) &&
        isFilled(draft.patient.lastName) &&
        birth !== null &&
        compareDates(birth, calendarDay(now)) <= 0 &&
        draft.patient.sex !== null &&
        isEmail(draft.patient.email) &&
        looked
      );
    }
    case 'helper': {
      const { helper } = draft;
      const relationshipGiven =
        helper.relationship !== null &&
        (helper.relationship !== 'other' || isFilled(helper.relationshipOther));
      return (
        isFilled(helper.firstName) &&
        isFilled(helper.lastName) &&
        relationshipGiven &&
        isUsPhone(helper.phone)
      );
    }
    case 'vaccines':
      return draft.vaccines.selections.length > 0 || draft.vaccines.notSure;
    case 'insurance': {
      const { insurance } = draft;
      if (!config.insuranceRequired) return true;
      // "No" and "I'm not sure" complete the section (SPEC 10.1, item 15).
      if (insurance.has === 'no' || insurance.has === 'notSure') return true;
      if (insurance.has !== 'yes') return false;
      if (insurance.entry === 'photo') {
        return insurance.frontImage !== null && insurance.backImage !== null;
      }
      if (insurance.kind === 'medicare') {
        return isMedicareNumber(insurance.medicareNumber) && isSsnLast4(insurance.ssnLast4);
      }
      if (insurance.kind === 'other') {
        // Group ID is optional: not every card has one.
        const { company, planName, bin, pcn, memberId } = insurance.card;
        return [company, planName, bin, pcn, memberId].every(isFilled) && isSsnLast4(insurance.ssnLast4);
      }
      return false;
    }
    case 'extras':
      return true;
    case 'sign': {
      const { sign } = draft;
      const roleAllowed =
        sign.signerRole === 'helper'
          ? hasHelper(state)
          : sign.signerRole === 'patient' && !fieldRules(state).requiresHelper;
      const signed = sign.method === 'typed' ? sign.agreeTyped : sign.drawing !== null;
      return (
        roleAllowed &&
        isFilled(sign.signerName) &&
        signed &&
        sign.pharmacyConsent &&
        sign.onecareConsent
      );
    }
  }
}

/** A section is complete once it is valid and the person has moved on from it. */
export function isSectionComplete(
  state: SignupState,
  section: SectionId,
  config: AppConfig,
  now: Date = new Date(),
): boolean {
  if (section === 'sign') return state.draft.signature !== null;
  return state.draft.confirmed.includes(section) && isSectionValid(state, section, config, now);
}

/** Required sections that still need attention before the sign-up can be sent. */
export function missingSections(
  state: SignupState,
  config: AppConfig,
  now: Date = new Date(),
): SectionId[] {
  return sectionList(state).filter(
    (section) =>
      section !== 'extras' && section !== 'sign' && !isSectionValid(state, section, config, now),
  );
}

export function canSubmit(state: SignupState, config: AppConfig, now: Date = new Date()): boolean {
  return (
    missingSections(state, config, now).length === 0 && isSectionValid(state, 'sign', config, now)
  );
}

// --- Vaccines (SPEC 5.3) ---------------------------------------------------

const STATUS_RANK: Record<VaccineStatusKind, number> = { due: 0, had: 1, none: 2 };

export interface VaccineListRow {
  vaccine: Vaccine;
  status: VaccineStatus;
  selection: VaccineSelection | null;
  /** False when the age rules say this vaccine is not usual at the patient's age. */
  fitsAge: boolean;
}

export interface VaccineList {
  /**
   * Every vaccine the clinic offers: due, then had, then no record. Nothing is hidden
   * by age (SPEC 10.1, item 12); `fitsAge` is there for a hint on the row.
   */
  rows: VaccineListRow[];
}

function statusOf(state: SignupState, vaccineId: VaccineId): VaccineStatus {
  return (
    state.statuses.find((status) => status.vaccineId === vaccineId) ?? {
      vaccineId,
      status: 'none',
      lastDate: null,
      lastProductId: null,
    }
  );
}

export function vaccineList(state: SignupState, rules: AgeRules = MOCK_AGE_RULES): VaccineList {
  const age = patientAge(state);
  const offered = (state.clinic?.offeredVaccines ?? [])
    .map(getVaccine)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const rows = offered
    .map((vaccine) => ({
      vaccine,
      status: statusOf(state, vaccine.id),
      selection:
        state.draft.vaccines.selections.find((item) => item.vaccineId === vaccine.id) ?? null,
      // Until the age is known no rule can apply.
      fitsAge: age === null || isAllowedAtAge(rules, vaccine.id, age),
    }))
    .sort(
      (a, b) =>
        STATUS_RANK[a.status.status] - STATUS_RANK[b.status.status] ||
        a.vaccine.displayOrder - b.vaccine.displayOrder,
    );

  return { rows };
}

/** Product choice is a clinic setting that defaults from the pharmacy. */
export function showsProductChoice(clinic: Clinic | null): boolean {
  if (!clinic) return false;
  return clinic.productChoice ?? clinic.pharmacy.productChoice;
}

/** Products with the one the patient had before first. */
export function orderedProducts(vaccine: Vaccine, status: VaccineStatus): VaccineProduct[] {
  return [...vaccine.products].sort(
    (a, b) => Number(b.id === status.lastProductId) - Number(a.id === status.lastProductId),
  );
}

/** The product preselected when a vaccine is added: the one the patient had before, if any. */
export function defaultProductChoice(
  vaccine: Vaccine,
  status: VaccineStatus,
  clinic: Clinic | null,
): ProductChoice | null {
  if (!showsProductChoice(clinic)) return null;
  const previous = vaccine.products.find((product) => product.id === status.lastProductId);
  return previous ? { kind: 'product', productId: previous.id } : null;
}

// --- Optional details (SPEC 5.6 and 5.8) ----------------------------------

/** Optional sub-panels not filled in yet. They appear under "Still open" on the Done screen. */
export function stillOpen(state: SignupState): ExtrasItem[] {
  const { extras } = state.draft;
  const open: ExtrasItem[] = [];
  if (!extras.health.saved) open.push('health');
  if (extras.address === null) open.push('address');
  if (!extras.remindByEmail && !extras.remindByText) open.push('reminders');
  if (extras.race === null) open.push('more');
  return open;
}
