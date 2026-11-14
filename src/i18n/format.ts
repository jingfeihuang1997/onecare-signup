import type { Language } from './translate';

// Dates are built in UTC and formatted in UTC, so the viewer's time zone never moves a day.

const LOCALES: Record<Language, string> = {
  en: 'en-US',
  es: 'es-US',
  'zh-Hans': 'zh-Hans',
};

function utcDate(isoDate: string, time = '00:00'): Date | null {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!date || !clock) return null;
  return new Date(
    Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(clock[1]), Number(clock[2])),
  );
}

function format(date: Date | null, language: Language, options: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  return new Intl.DateTimeFormat(LOCALES[language], { ...options, timeZone: 'UTC' }).format(date);
}

/** "Apr 12, 1954" in English. Takes YYYY-MM-DD. */
export function formatDate(isoDate: string, language: Language): string {
  return format(utcDate(isoDate), language, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Sep 2024" in English, for the "Had it" chip. Takes YYYY-MM-DD. */
export function formatMonthYear(isoDate: string, language: Language): string {
  return format(utcDate(isoDate), language, { month: 'short', year: 'numeric' });
}

/** "Tue, Dec 1, 2026" in English. Takes YYYY-MM-DD. */
export function formatClinicDate(isoDate: string, language: Language): string {
  return format(utcDate(isoDate), language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "10:00 AM" in English. Takes HH:mm. */
export function formatClinicTime(time: string, language: Language): string {
  return format(utcDate('2000-01-01', time), language, { hour: 'numeric', minute: '2-digit' });
}
