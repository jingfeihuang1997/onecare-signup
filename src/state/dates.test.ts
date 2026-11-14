import { formatClinicDate, formatClinicTime, formatDate, formatMonthYear } from '../i18n';
import { referenceState } from '../test/fixtures';
import { ageOn, calendarDay, compareDates, parseDob, parseIsoDate, toIsoDate } from './dates';
import { buildSignature } from './signature';
import { isEmail, isMedicareNumber, isSsnLast4, isUsPhone } from './validation';

describe('dates', () => {
  it('reads a date of birth only when it is a real date', () => {
    expect(parseDob({ month: '04', day: '12', year: '1954' })).toEqual({ year: 1954, month: 4, day: 12 });
    expect(parseDob({ month: '4', day: '2', year: '1954' })).toEqual({ year: 1954, month: 4, day: 2 });
    expect(parseDob({ month: '02', day: '29', year: '2024' })).not.toBeNull();
    expect(parseDob({ month: '02', day: '29', year: '2023' })).toBeNull();
    expect(parseDob({ month: '13', day: '01', year: '1990' })).toBeNull();
    expect(parseDob({ month: '04', day: '31', year: '1990' })).toBeNull();
    expect(parseDob({ month: '04', day: '12', year: '54' })).toBeNull();
    expect(parseDob({ month: '', day: '', year: '' })).toBeNull();
    expect(parseDob({ month: '04', day: '12', year: '1899' })).toBeNull();
  });

  it('counts whole years, changing on the birthday', () => {
    const birth = { year: 1961, month: 12, day: 1 };
    expect(ageOn(birth, { year: 2026, month: 11, day: 30 })).toBe(64);
    expect(ageOn(birth, { year: 2026, month: 12, day: 1 })).toBe(65);
    expect(ageOn({ year: 2024, month: 2, day: 29 }, { year: 2025, month: 2, day: 28 })).toBe(0);
    expect(ageOn({ year: 2024, month: 2, day: 29 }, { year: 2025, month: 3, day: 1 })).toBe(1);
  });

  it('converts and compares calendar days', () => {
    expect(parseIsoDate('2026-12-01')).toEqual({ year: 2026, month: 12, day: 1 });
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('Dec 1')).toBeNull();
    expect(toIsoDate({ year: 1954, month: 4, day: 12 })).toBe('1954-04-12');
    expect(compareDates({ year: 2026, month: 1, day: 2 }, { year: 2026, month: 1, day: 1 })).toBeGreaterThan(0);
    expect(calendarDay(new Date(2026, 10, 14, 23, 59))).toEqual({ year: 2026, month: 11, day: 14 });
  });

  it('formats dates the way the reference pages show them', () => {
    expect(formatDate('1954-04-12', 'en')).toBe('Apr 12, 1954');
    expect(formatMonthYear('2024-09-20', 'en')).toBe('Sep 2024');
    expect(formatClinicDate('2026-12-01', 'en')).toBe('Tue, Dec 1, 2026');
    expect(formatClinicTime('10:00', 'en')).toBe('10:00 AM');
    expect(formatDate('1954-04-12', 'zh-Hans')).toBe('1954年4月12日');
    expect(formatDate('not a date', 'en')).toBe('');
  });
});

describe('validation', () => {
  it('checks email, phone, Medicare number and last 4 of SSN', () => {
    expect(isEmail('ana.lopez@example.com')).toBe(true);
    expect(isEmail('ana.lopez@')).toBe(false);
    expect(isUsPhone('(313) 555-0142')).toBe(true);
    expect(isUsPhone('+1 313 555 0142')).toBe(true);
    expect(isUsPhone('555-0142')).toBe(false);
    expect(isMedicareNumber('1EG4-TE5-MK73')).toBe(true);
    expect(isMedicareNumber('1EG4TE5MK73')).toBe(true);
    expect(isMedicareNumber('1EG4-TE5')).toBe(false);
    expect(isSsnLast4('6789')).toBe(true);
    expect(isSsnLast4('678')).toBe(false);
    expect(isSsnLast4('67a9')).toBe(false);
  });
});

describe('buildSignature', () => {
  const context = {
    now: new Date('2026-11-14T15:30:00.000Z'),
    userAgent: 'TestBrowser/1.0',
    consentVersion: 'draft-2026-11',
  };

  it('records signer name, role, method, ISO timestamp, consent version and user agent', () => {
    expect(buildSignature(referenceState().draft, context)).toEqual({
      signerName: 'Ana Lopez',
      signerRole: 'helper',
      method: 'typed',
      drawing: null,
      signedAt: '2026-11-14T15:30:00.000Z',
      consentVersion: 'draft-2026-11',
      userAgent: 'TestBrowser/1.0',
    });
  });

  it('keeps the drawing for a drawn signature, and needs a signer', () => {
    const { draft } = referenceState();
    draft.sign = { ...draft.sign, method: 'drawn', drawing: 'data:image/png;base64,DRAWN' };
    expect(buildSignature(draft, context)?.drawing).toBe('data:image/png;base64,DRAWN');

    draft.sign.signerRole = null;
    expect(buildSignature(draft, context)).toBeNull();
  });
});
