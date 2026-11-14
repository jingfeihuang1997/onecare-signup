import { SEED_CLINIC, SEED_MARIA, SEED_NEW_PATIENT } from '../data/seed';
import { referenceState } from '../test/fixtures';
import { createMockServices } from './mock';

const services = createMockServices({ delayMs: 0 });

describe('mock services', () => {
  it('answers after a short delay, not at once', async () => {
    vi.useFakeTimers();
    try {
      const slow = createMockServices({ delayMs: 200 });
      let done = false;
      const pending = slow.getClinic(SEED_CLINIC.token).then(() => {
        done = true;
      });
      await vi.advanceTimersByTimeAsync(199);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('getClinic returns the pharmacy, date, time, address, vaccines and product-choice setting', async () => {
    const clinic = await services.getClinic(SEED_CLINIC.token);
    expect(clinic).toEqual(SEED_CLINIC);
    // A copy: changing the result must not change the seed.
    clinic.offeredVaccines.length = 0;
    expect(SEED_CLINIC.offeredVaccines).toHaveLength(16);
    await expect(services.getClinic('no-such-clinic')).rejects.toThrow();
  });

  it('lookupPatient finds Maria and returns her record masked', async () => {
    const result = await services.lookupPatient(' maria ', 'LOPEZ', { month: '4', day: '12', year: '1954' });
    expect(result.found).toBe(true);
    expect(result.maskedRecord).toEqual(SEED_MARIA.record);
    expect(result.maskedRecord?.phone).toBe('(•••) •••-0142');
  });

  it('lookupPatient finds nothing for the second seed patient or a wrong date of birth', async () => {
    const { firstName, lastName, dob } = SEED_NEW_PATIENT;
    expect(await services.lookupPatient(firstName, lastName, dob)).toEqual({
      found: false,
      maskedRecord: null,
    });
    const wrongYear = await services.lookupPatient('Maria', 'Lopez', { month: '04', day: '12', year: '1955' });
    expect(wrongYear.found).toBe(false);
  });

  it('getVaccineStatus returns one status per vaccine', async () => {
    const statuses = await services.getVaccineStatus(SEED_MARIA.record.patientId);
    expect(statuses).toHaveLength(16);
    expect(statuses.find((status) => status.vaccineId === 'flu')).toEqual({
      vaccineId: 'flu',
      status: 'due',
      lastDate: '2025-10-14',
      lastProductId: 'fluzone-hd',
    });
    expect(statuses.find((status) => status.vaccineId === 'rsv')?.status).toBe('had');

    const unknown = await services.getVaccineStatus(null);
    expect(unknown).toHaveLength(16);
    expect(unknown.every((status) => status.status === 'none' && status.lastDate === null)).toBe(true);
  });

  it('readCard returns fields with a confidence between 0 and 1', async () => {
    const front = await services.readCard('data:image/png;base64,AAAA', 'front');
    const back = await services.readCard('data:image/png;base64,AAAA', 'back');
    expect(Object.keys(front.fields)).toEqual(['company', 'planName', 'memberId', 'groupId']);
    expect(Object.keys(back.fields)).toEqual(['bin', 'pcn']);
    for (const field of [...Object.values(front.fields), ...Object.values(back.fields)]) {
      expect(field.value).toBeTruthy();
      expect(field.confidence).toBeGreaterThan(0);
      expect(field.confidence).toBeLessThanOrEqual(1);
    }
    // At least one low-confidence field per side, so the "please check" state can be shown.
    expect(Object.values(front.fields).some((field) => field.confidence < 0.7)).toBe(true);

    const medicare = await services.readCard('data:image/png;base64,AAAA', 'front', 'medicare');
    expect(medicare.fields.medicareNumber?.value).toBe('1EG4-TE5-MK73');
  });

  it('searchAddress returns at most five US suggestions, from three characters on', async () => {
    const matches = await services.searchAddress('1420 Map');
    expect(matches).toHaveLength(5);
    expect(matches[0]).toEqual({
      id: 'addr-1',
      street: '1420 Maple St',
      city: 'Ann Arbor',
      state: 'MI',
      zip: '48104',
    });
    expect(matches.every((match) => /^[A-Z]{2}$/.test(match.state) && /^\d{5}$/.test(match.zip))).toBe(true);

    expect(await services.searchAddress('14')).toEqual([]);
    expect(await services.searchAddress('no such street')).toEqual([]);
    expect((await services.searchAddress('ann arbor')).length).toBeGreaterThan(0);
  });

  it('submitSignup returns a confirmation id for a signed draft only', async () => {
    const { draft } = referenceState();
    await expect(services.submitSignup(draft)).rejects.toThrow();

    const signed = {
      ...draft,
      signature: {
        signerName: 'Ana Lopez',
        signerRole: 'helper' as const,
        method: 'typed' as const,
        drawing: null,
        signedAt: '2026-11-14T12:00:00.000Z',
        consentVersion: 'draft-2026-11',
        userAgent: 'test',
      },
    };
    const first = await services.submitSignup(signed);
    const second = await services.submitSignup(signed);
    expect(first.confirmationId).toMatch(/^OC-MOCK-\d{4}$/);
    expect(second.confirmationId).not.toBe(first.confirmationId);
  });
});
