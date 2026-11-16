import { MemoryStorage, ThrowingStorage, referenceState } from '../test/fixtures';
import type { SignupDraft } from '../types';
import {
  MAX_AGE_DAYS,
  STORAGE_KEY,
  browserStorage,
  createDeviceMemory,
  draftFromStored,
} from './deviceMemory';

const DAY_MS = 24 * 60 * 60 * 1000;
const T0 = new Date('2026-11-14T12:00:00.000Z');

/** One recognisable value for every field on the "Never store" list of SPEC section 6. */
const SECRETS = {
  ssnLast4: '9876',
  medicareNumber: '9ZZ9-ZZ9-ZZ99',
  company: 'SECRET-COMPANY',
  planName: 'SECRET-PLAN',
  bin: 'SECRET-BIN',
  pcn: 'SECRET-PCN',
  memberId: 'SECRET-MEMBER',
  groupId: 'SECRET-GROUP',
  frontImage: 'data:image/png;base64,SECRETFRONT',
  backImage: 'data:image/png;base64,SECRETBACK',
  sex: 'SECRET-SEX',
  race: 'SECRET-RACE',
  drawing: 'data:image/png;base64,SECRETDRAWING',
  userAgent: 'SECRET-USER-AGENT',
  consentVersion: 'SECRET-CONSENT-VERSION',
};

/** Property names that must never appear anywhere in the stored JSON. */
const FORBIDDEN_KEYS = [
  'ssnLast4', 'medicareNumber', 'insurance', 'card', 'company', 'planName', 'bin', 'pcn',
  'memberId', 'groupId', 'frontImage', 'backImage', 'checkFields',
  'health', 'answers', 'sex', 'race', 'extras',
  'sign', 'signature', 'signerName', 'signerRole', 'drawing', 'agreeTyped',
  'pharmacyConsent', 'onecareConsent', 'userAgent', 'consentVersion',
  'lookup', 'record', 'recordId', 'patientId', 'confirmationId',
];

/** The reference scenario, signed and submitted, with a secret in every sensitive field. */
function draftFullOfSecrets(): SignupDraft {
  const { draft } = referenceState();
  return {
    ...draft,
    patient: { ...draft.patient, sex: SECRETS.sex },
    insurance: {
      has: 'yes',
      kind: 'medicare',
      medicareNumber: SECRETS.medicareNumber,
      ssnLast4: SECRETS.ssnLast4,
      card: {
        company: SECRETS.company,
        planName: SECRETS.planName,
        bin: SECRETS.bin,
        pcn: SECRETS.pcn,
        memberId: SECRETS.memberId,
        groupId: SECRETS.groupId,
      },
      frontImage: SECRETS.frontImage,
      backImage: SECRETS.backImage,
      entry: 'photo',
      checkFields: ['groupId'],
    },
    extras: {
      ...draft.extras,
      health: { saved: true, answers: draft.extras.health.answers.map(() => 'yes' as const) },
      race: SECRETS.race,
      phone: '(313) 555-0100',
      remindByEmail: true,
      remindByText: true,
      reminderPhone: '(313) 555-0199',
      reminderEmail: 'maria@example.com',
    },
    sign: { ...draft.sign, method: 'drawn', drawing: SECRETS.drawing },
    signature: {
      signerName: 'Ana Lopez',
      signerRole: 'helper',
      method: 'drawn',
      drawing: SECRETS.drawing,
      signedAt: T0.toISOString(),
      consentVersion: SECRETS.consentVersion,
      userAgent: SECRETS.userAgent,
    },
    confirmationId: 'OC-MOCK-0001',
    currentSection: 'done',
  };
}

function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys);
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...allKeys(child)]);
}

function setup(options: { enabled?: boolean; at?: Date } = {}) {
  const storage = new MemoryStorage();
  let clock = options.at ?? T0;
  const memory = createDeviceMemory({
    enabled: options.enabled ?? true,
    storage,
    now: () => clock,
  });
  return {
    storage,
    memory,
    raw: () => storage.getItem(STORAGE_KEY) ?? '',
    advanceDays: (days: number) => {
      clock = new Date(clock.getTime() + days * DAY_MS);
    },
  };
}

describe('device memory: what is stored', () => {
  it('uses the single key onecare.signup.v1 and holds JSON', () => {
    const { memory, storage } = setup();
    memory.saveDraft(referenceState().draft);
    expect(storage.length).toBe(1);
    expect(storage.key(0)).toBe('onecare.signup.v1');
    expect(() => JSON.parse(storage.getItem(STORAGE_KEY) ?? '')).not.toThrow();
  });

  it('never contains a field on the "Never store" list', () => {
    const { memory, raw } = setup();
    memory.saveDraft(draftFullOfSecrets());
    const json = raw();
    expect(json).not.toBe('');

    // No sensitive value anywhere in the serialized JSON...
    for (const [field, secret] of Object.entries(SECRETS)) {
      expect(json, `${field} leaked`).not.toContain(secret);
    }
    expect(json).not.toContain('SECRET');
    expect(json).not.toContain('"yes"');
    // ...the masked record from the lookup is not stored either...
    expect(json).not.toContain('•');
    expect(json).not.toContain('K73');
    // ...and no property by any of those names.
    const keys = allKeys(JSON.parse(json));
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(keys, `key "${forbidden}" stored`).not.toContain(forbidden);
    }
  });

  it('stores exactly the fields SPEC section 6 allows', () => {
    const { memory, raw } = setup();
    memory.saveDraft(draftFullOfSecrets());
    const stored = JSON.parse(raw());

    expect(Object.keys(stored).sort()).toEqual(['helper', 'patients', 'prefs', 'version']);
    expect(Object.keys(stored.helper).sort()).toEqual([
      'firstName', 'lastName', 'phone', 'relationship', 'relationshipOther', 'savedAt',
    ]);
    expect(Object.keys(stored.patients[0]).sort()).toEqual([
      'address', 'clinicToken', 'confirmed', 'currentSection', 'dob', 'email', 'emailOwner',
      'firstName', 'forWhom', 'id', 'lastName', 'phone', 'preferredName', 'remindByEmail',
      'remindByText', 'reminderEmail', 'reminderPhone', 'savedAt', 'submitted', 'vaccines',
    ]);
    expect(stored.patients[0]).toMatchObject({
      firstName: 'Maria',
      lastName: 'Lopez',
      dob: { month: '04', day: '12', year: '1954' },
      currentSection: 'done',
      submitted: true,
      email: 'ana.lopez@example.com',
      phone: '(313) 555-0100',
      remindByText: true,
      reminderPhone: '(313) 555-0199',
      address: { kind: 'entered', street: '1420 Maple St', zip: '48104' },
    });
    expect(stored.patients[0].vaccines.selections).toHaveLength(3);
  });

  it('does not store an address that is only on file at the pharmacy', () => {
    const { memory } = setup();
    const { draft } = referenceState();
    draft.extras.address = { kind: 'onFile', masked: '•••• Maple St, Ann Arbor, MI ••104' };
    memory.saveDraft(draft);
    expect(memory.read().patients[0]?.address).toBeNull();
  });

  it('keeps one entry per draft and saves nothing for an empty draft', () => {
    const { memory, raw } = setup();
    const empty = referenceState().draft;
    empty.forWhom = null;
    empty.patient = { ...empty.patient, firstName: '', lastName: '' };
    empty.helper = { ...empty.helper, firstName: '', lastName: '' };
    memory.saveDraft(empty);
    expect(raw()).toBe('');

    const { draft } = referenceState();
    memory.saveDraft(draft);
    memory.saveDraft({ ...draft, currentSection: 'insurance' });
    expect(memory.read().patients).toHaveLength(1);
    expect(memory.read().patients[0]?.currentSection).toBe('insurance');

    memory.saveDraft({ ...draft, id: 'another-draft' });
    expect(memory.read().patients).toHaveLength(2);
  });

  it('drops anything unexpected when reading, even if someone put it there', () => {
    const { memory, storage } = setup();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        prefs: { language: 'fr', textSizeStep: 2, tracking: 'x' },
        helper: null,
        patients: [
          {
            id: 'p1',
            savedAt: T0.toISOString(),
            firstName: 'Maria',
            ssnLast4: '9876',
            vaccines: { selections: [{ vaccineId: 'flu' }, { vaccineId: 'not-a-vaccine' }] },
            currentSection: 'somewhere',
          },
          'not an entry',
        ],
      }),
    );
    const data = memory.read();
    expect(data.prefs).toEqual({ textSizeStep: 2 });
    expect(data.patients).toHaveLength(1);
    expect(data.patients[0]).not.toHaveProperty('ssnLast4');
    expect(data.patients[0]?.vaccines.selections.map((item) => item.vaccineId)).toEqual(['flu']);
    expect(data.patients[0]?.currentSection).toBe('start');
  });
});

describe('device memory: continue, expire, forget', () => {
  it('rebuilds a draft to continue, with every sensitive field empty again', () => {
    const { memory } = setup();
    const original = { ...draftFullOfSecrets(), currentSection: 'insurance' as const, confirmationId: null };
    memory.saveDraft(original);
    const data = memory.read();
    const entry = data.patients[0];
    if (!entry) throw new Error('entry was saved');
    const draft = draftFromStored(entry, data.helper);

    expect(draft.id).toBe(original.id);
    expect(draft.forWhom).toBe('other');
    expect(draft.patient).toMatchObject({ firstName: 'Maria', lastName: 'Lopez', recordId: null });
    expect(draft.helper).toEqual(original.helper);
    expect(draft.vaccines).toEqual(original.vaccines);
    expect(draft.currentSection).toBe('insurance');
    // Insurance and the optional details lost their content, so they are not done any more.
    expect(draft.confirmed).toEqual(['patient', 'helper', 'vaccines']);
    expect(draft.extras.reminderEmail).toBe('maria@example.com');
    expect(draft.extras.remindByEmail).toBe(true);
    expect(draft.patient.email).toBe('ana.lopez@example.com');

    expect(draft.insurance.has).toBeNull();
    expect(draft.insurance.kind).toBeNull();
    expect(draft.insurance.medicareNumber).toBe('');
    expect(draft.extras.health).toEqual({ saved: false, answers: Array(14).fill('no') });
    expect(draft.patient.sex).toBeNull();
    expect(draft.extras.race).toBeNull();
    expect(draft.sign.drawing).toBeNull();
    expect(draft.signature).toBeNull();
    expect(draft.lookup.status).toBe('idle');
    expect(JSON.stringify(draft)).not.toContain('SECRET');
  });

  it(`expires entries after ${MAX_AGE_DAYS} days`, () => {
    const { memory, advanceDays } = setup();
    memory.savePrefs({ language: 'es' });
    memory.saveDraft(referenceState().draft);

    advanceDays(MAX_AGE_DAYS);
    expect(memory.read().patients).toHaveLength(1);
    expect(memory.read().helper?.firstName).toBe('Ana');

    advanceDays(1);
    expect(memory.read().patients).toEqual([]);
    expect(memory.read().helper).toBeNull();
    // Preferences hold no personal details and stay.
    expect(memory.read().prefs).toEqual({ language: 'es' });
  });

  it('removes an expired entry from storage at the next save', () => {
    const { memory, advanceDays, raw } = setup();
    memory.saveDraft({ ...referenceState().draft, id: 'old-draft' });
    advanceDays(MAX_AGE_DAYS + 1);
    memory.saveDraft({ ...referenceState().draft, id: 'new-draft' });
    expect(raw()).not.toContain('old-draft');
    expect(memory.read().patients.map((entry) => entry.id)).toEqual(['new-draft']);
  });

  it('"Forget what is saved on this device" deletes the key', () => {
    const { memory, storage } = setup();
    memory.savePrefs({ textSizeStep: 3 });
    memory.saveDraft(referenceState().draft);
    memory.forget();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.length).toBe(0);
    expect(memory.read()).toEqual({ version: 1, prefs: {}, helper: null, patients: [] });
  });

  it('remembers language and text size', () => {
    const { memory } = setup();
    memory.savePrefs({ language: 'zh-Hans' });
    memory.savePrefs({ textSizeStep: 2 });
    expect(memory.read().prefs).toEqual({ language: 'zh-Hans', textSizeStep: 2 });
  });
});

describe('device memory: the config flag', () => {
  it('when off, stores no draft and no helper, but still remembers preferences', () => {
    const { memory, raw } = setup({ enabled: false });
    memory.saveDraft(draftFullOfSecrets());
    expect(raw()).toBe('');

    memory.savePrefs({ language: 'es', textSizeStep: 1 });
    expect(JSON.parse(raw())).toEqual({
      version: 1,
      prefs: { language: 'es', textSizeStep: 1 },
      helper: null,
      patients: [],
    });
  });

  it('when off, ignores drafts saved earlier and clears them at the next write', () => {
    const storage = new MemoryStorage();
    createDeviceMemory({ enabled: true, storage, now: () => T0 }).saveDraft(referenceState().draft);

    const off = createDeviceMemory({ enabled: false, storage, now: () => T0 });
    expect(off.read().patients).toEqual([]);
    expect(off.read().helper).toBeNull();
    off.savePrefs({ textSizeStep: 1 });
    expect(storage.getItem(STORAGE_KEY)).not.toContain('Maria');
  });
});

describe('device memory: when storage fails', () => {
  it('works when every localStorage call throws', () => {
    const memory = createDeviceMemory({ enabled: true, storage: new ThrowingStorage() });
    expect(() => memory.saveDraft(referenceState().draft)).not.toThrow();
    expect(() => memory.savePrefs({ language: 'es' })).not.toThrow();
    expect(() => memory.forget()).not.toThrow();
    expect(memory.read()).toEqual({ version: 1, prefs: {}, helper: null, patients: [] });
  });

  it('works with no storage at all', () => {
    const memory = createDeviceMemory({ enabled: true, storage: null });
    expect(() => memory.saveDraft(referenceState().draft)).not.toThrow();
    expect(memory.read().patients).toEqual([]);
  });

  it('works when reading window.localStorage itself throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(browserStorage()).toBeNull();
      const memory = createDeviceMemory({ enabled: true });
      expect(() => memory.saveDraft(referenceState().draft)).not.toThrow();
      expect(memory.read().patients).toEqual([]);
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });

  it('treats text that is not JSON, or another version, as empty', () => {
    const { memory, storage } = setup();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(memory.read().patients).toEqual([]);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, patients: [{ id: 'x' }] }));
    expect(memory.read().patients).toEqual([]);
    // And it can still save over it.
    memory.saveDraft(referenceState().draft);
    expect(memory.read().patients).toHaveLength(1);
  });
});
