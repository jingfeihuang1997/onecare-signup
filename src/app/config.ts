/** Feature flags and settings. One place to change when OneCare answers an open question. */
export interface AppConfig {
  /** Token of the clinic to load. The real link from the pharmacy will carry it. */
  clinicToken: string;
  /**
   * Device memory for drafts and helper details (SPEC 6). [Pending OneCare privacy sign-off.]
   * Language and text size are remembered either way (SPEC 10.2).
   */
  deviceMemory: boolean;
  /** Whether Insurance must be filled in before signing (SPEC 5.4). "No insurance" always passes. */
  insuranceRequired: boolean;
  /** Version of the consent wording stored with each signature. [Pending legal review.] */
  consentVersion: string;
  /** Shows "Demo only" on Start. On while every service is a mock. */
  demoNotice: boolean;
  /** Delay of the mock services, in milliseconds. */
  mockDelayMs: number;
  /** Pause after the last keystroke before the record lookup runs, in milliseconds. */
  lookupDelayMs: number;
}

export const defaultConfig: AppConfig = {
  clinicToken: 'cedar-lane-2026-12-01',
  // On in the prototype so the "Welcome back" screens can be shown. Off by default in production.
  deviceMemory: true,
  insuranceRequired: true,
  consentVersion: 'draft-2026-11',
  demoNotice: true,
  mockDelayMs: 250,
  lookupDelayMs: 500,
};
