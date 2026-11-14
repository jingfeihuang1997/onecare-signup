import type {
  AddressSuggestion,
  CardReading,
  CardSide,
  Clinic,
  DateOfBirth,
  LookupResult,
  SignupDraft,
  VaccineStatus,
} from '../types';

/**
 * Everything the sign-up asks a server for (SPEC section 8). The app only ever talks to
 * this interface. Today it is backed by mocks; later each method maps to a real endpoint.
 */
export interface SignupServices {
  /** Pharmacy, date and time, address, offered vaccines and the product-choice setting. */
  getClinic(token: string): Promise<Clinic>;

  /** Finds an existing record by name and date of birth. Stored values come back masked. */
  lookupPatient(firstName: string, lastName: string, dob: DateOfBirth): Promise<LookupResult>;

  /** Status, last date and last product for each vaccine. Pass null for a patient with no record. */
  getVaccineStatus(patientId: string | null): Promise<VaccineStatus[]>;

  /**
   * Reads one side of an insurance card. `expect` says which kind of card the person
   * chose, so the reader knows which fields to look for (SPEC 10.1, item 10).
   */
  readCard(image: Blob | string, side: CardSide, expect?: 'medicare' | 'other'): Promise<CardReading>;

  /** Up to five US address suggestions. */
  searchAddress(query: string): Promise<AddressSuggestion[]>;

  /** Sends the signed sign-up. */
  submitSignup(draft: SignupDraft): Promise<{ confirmationId: string }>;
}
