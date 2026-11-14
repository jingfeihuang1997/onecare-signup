import type { DateOfBirth } from '../types';

/** A calendar day with no time and no time zone. Month is 1 to 12. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isRealDate(year: number, month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** Reads the three date-of-birth inputs. Returns null unless they form a real date. */
export function parseDob(dob: DateOfBirth): CalendarDate | null {
  if (!/^\d{1,2}$/.test(dob.month) || !/^\d{1,2}$/.test(dob.day) || !/^\d{4}$/.test(dob.year)) {
    return null;
  }
  const date = { year: Number(dob.year), month: Number(dob.month), day: Number(dob.day) };
  if (date.year < 1900 || !isRealDate(date.year, date.month, date.day)) return null;
  return date;
}

/** Reads YYYY-MM-DD. */
export function parseIsoDate(iso: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isRealDate(date.year, date.month, date.day) ? date : null;
}

export function toIsoDate(date: CalendarDate): string {
  const pad = (value: number, length: number) => String(value).padStart(length, '0');
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

/** Negative when a is earlier than b, zero when equal, positive when later. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Whole years between a birth date and another day. */
export function ageOn(birth: CalendarDate, on: CalendarDate): number {
  const hadBirthday = on.month > birth.month || (on.month === birth.month && on.day >= birth.day);
  return on.year - birth.year - (hadBirthday ? 0 : 1);
}

/** The local calendar day of a moment. */
export function calendarDay(moment: Date): CalendarDate {
  return { year: moment.getFullYear(), month: moment.getMonth() + 1, day: moment.getDate() };
}
