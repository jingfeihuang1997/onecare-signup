// Data model for the sign-up (SPEC section 8). Shared by options A and B.

// --- Clinic and pharmacy ---------------------------------------------------

export type VaccineId =
  | 'flu'
  | 'covid'
  | 'tdap'
  | 'shingles'
  | 'pneumococcal'
  | 'rsv'
  | 'hepb'
  | 'mmr'
  | 'varicella'
  | 'hpv'
  | 'menacwy'
  | 'dtap'
  | 'hib'
  | 'rotavirus'
  | 'polio'
  | 'hepa';

export interface Pharmacy {
  id: string;
  name: string;
  /** Placeholder in square brackets until the real number is supplied. */
  phone: string;
  /** Two-letter US state. */
  state: string;
  /** Short name of the state immunization registry, for example "MCIR". */
  registry: string;
  /** Whether people may choose a product (brand) for a vaccine. Clinics inherit it. */
  productChoice: boolean;
}

export interface Clinic {
  token: string;
  pharmacy: Pharmacy;
  /** Local date of the clinic, YYYY-MM-DD. */
  date: string;
  /** Local start time, HH:mm (24 hour). */
  time: string;
  timeZone: string;
  /** Placeholder in square brackets until the real address is supplied. */
  address: string;
  offeredVaccines: VaccineId[];
  /** null means: use the pharmacy's setting. */
  productChoice: boolean | null;
}

// --- People ----------------------------------------------------------------

/** Date of birth as typed: three numeric strings. */
export interface DateOfBirth {
  month: string;
  day: string;
  year: string;
}

export interface Patient {
  /** Id of the pharmacy record, once the person confirmed it is the right one. */
  recordId: string | null;
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: DateOfBirth;
}

/** What the lookup returns about an existing record. Values arrive already masked. */
export interface MaskedRecord {
  patientId: string;
  address: string | null;
  phone: string | null;
  insurance: { kind: 'medicare'; ending: string } | { kind: 'other'; company: string } | null;
}

export interface LookupResult {
  found: boolean;
  maskedRecord: MaskedRecord | null;
}

export type RelationshipId = 'child' | 'spouse' | 'parent' | 'guardian' | 'other';

/** The person signing up someone else. Not always a parent, so the wording stays neutral. */
export interface Helper {
  firstName: string;
  lastName: string;
  relationship: RelationshipId | null;
  /** Free text, used when the relationship is "other" (SPEC 10.1, item 8). */
  relationshipOther: string;
  phone: string;
  email: string;
}

// --- Vaccines --------------------------------------------------------------

export interface VaccineProduct {
  id: string;
  /** Brand name as shown in the list, for example "Spikevax (Moderna)". */
  name: string;
  /** Brand name for one-line summaries, for example "Spikevax". */
  shortName: string;
  /** Shows "Suggested for age N+" from this age. */
  suggestedFromAge?: number;
}

/** A catalog entry. Its name and "Why it matters" copy live in the dictionaries. */
export interface Vaccine {
  id: VaccineId;
  /** Position in the list, used after the status sort. */
  displayOrder: number;
  products: VaccineProduct[];
}

export type VaccineStatusKind = 'due' | 'had' | 'none';

export interface VaccineStatus {
  vaccineId: VaccineId;
  status: VaccineStatusKind;
  /** Last dose on record, YYYY-MM-DD. */
  lastDate: string | null;
  lastProductId: string | null;
}

export type ProductChoice =
  | { kind: 'product'; productId: string }
  | { kind: 'noPreference' }
  | { kind: 'askPharmacist' };

export interface VaccineSelection {
  vaccineId: VaccineId;
  /** null when the vaccine has no product choice. */
  product: ProductChoice | null;
  /** The person pressed "Keep it" on the "had it" warning. */
  keptAfterWarning: boolean;
}

// --- Insurance -------------------------------------------------------------

export type CardSide = 'front' | 'back';

export interface CardFields {
  company: string;
  planName: string;
  bin: string;
  pcn: string;
  memberId: string;
  groupId: string;
}

export type CardFieldName = keyof CardFields | 'medicareNumber';

/** What the card reader found, with a confidence between 0 and 1 for each field. */
export interface CardReading {
  side: CardSide;
  fields: Partial<Record<CardFieldName, { value: string; confidence: number }>>;
}

/** "medicare", any "other" insurance, or "none" (SPEC 10.1, item 10). */
export type InsuranceKind = 'medicare' | 'other' | 'none';

export interface Insurance {
  kind: InsuranceKind | null;
  medicareNumber: string;
  ssnLast4: string;
  card: CardFields;
  /** Card photos as data URLs, kept for the pharmacy. Never written to device memory. */
  frontImage: string | null;
  backImage: string | null;
  /** How the card fields were entered. */
  entry: 'photo' | 'manual' | null;
  /** Fields the reader was unsure about, for the person to check. */
  checkFields: CardFieldName[];
}

// --- Optional details ------------------------------------------------------

export type HealthAnswer = 'yes' | 'no' | 'notSure';

export interface EnteredAddress {
  kind: 'entered';
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

/** The record's own address. Only its masked form ever reaches the browser. */
export interface AddressOnFile {
  kind: 'onFile';
  masked: string;
}

export type HomeAddress = EnteredAddress | AddressOnFile;

export interface AddressSuggestion {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Extras {
  health: {
    /** True once the person opened the questions and pressed "Save answers". */
    saved: boolean;
    /** One answer per question. All start as "no" (SPEC 5.6). */
    answers: HealthAnswer[];
  };
  sex: string | null;
  race: string | null;
  address: HomeAddress | null;
  reminderPhone: string;
  reminderEmail: string;
  /** The person pressed "Skip for now". */
  skipped: boolean;
}

export type ExtrasItem = 'health' | 'more' | 'address' | 'reminders';

// --- Signing ---------------------------------------------------------------

export type SignerRole = 'patient' | 'helper';
export type SignatureMethod = 'typed' | 'drawn';

/** What the person has entered on the Sign step so far. */
export interface SignState {
  signerRole: SignerRole | null;
  signerName: string;
  method: SignatureMethod;
  /** Drawn signature as a data URL. */
  drawing: string | null;
  agreeTyped: boolean;
  pharmacyConsent: boolean;
  onecareConsent: boolean;
}

/** The record stored with a submitted sign-up (SPEC 5.7). */
export interface Signature {
  signerName: string;
  signerRole: SignerRole;
  method: SignatureMethod;
  /** Drawn signature as a data URL; null for a typed signature. */
  drawing: string | null;
  /** ISO 8601 timestamp. */
  signedAt: string;
  consentVersion: string;
  userAgent: string;
}

// --- The draft -------------------------------------------------------------

/** Sections in flow order (SPEC 10.1, item 2). "helper" exists only when someone else signs up. */
export type SectionId = 'patient' | 'helper' | 'vaccines' | 'insurance' | 'extras' | 'sign';

export type DraftPosition = 'start' | SectionId | 'done';

export interface SignupDraft {
  /** Random id of this draft. Identifies its entry in device memory. */
  id: string;
  clinicToken: string;
  forWhom: 'self' | 'other' | null;
  patient: Patient;
  lookup: {
    status: 'idle' | 'found' | 'notFound';
    record: MaskedRecord | null;
    /** The person pressed "Yes, this is right". */
    confirmed: boolean;
  };
  helper: Helper;
  vaccines: {
    selections: VaccineSelection[];
    /** "I'm not sure what [name] needs". Sent along with any selections. */
    notSure: boolean;
  };
  insurance: Insurance;
  extras: Extras;
  sign: SignState;
  /** Sections the person has pressed Continue on. */
  confirmed: SectionId[];
  currentSection: DraftPosition;
  signature: Signature | null;
  confirmationId: string | null;
}
