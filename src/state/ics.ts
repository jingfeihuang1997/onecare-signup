import type { Clinic } from '../types';

// Builds the "Add to calendar" file (SPEC 5.8) as iCalendar text. Pure, so it can be tested.

/** How long the calendar entry lasts. The clinic's real end time is not known yet. */
export const CALENDAR_ENTRY_MINUTES = 60;

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** "20261201T100000" from a date (YYYY-MM-DD) and a time (HH:mm), plus some minutes. */
function localStamp(date: string, time: string, addMinutes = 0): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  // UTC is used only as a calendar to add minutes with; the result is read back as local time.
  const moment = new Date(Date.UTC(year, month - 1, day, hour, minute + addMinutes));
  return (
    `${moment.getUTCFullYear()}${pad(moment.getUTCMonth() + 1)}${pad(moment.getUTCDate())}` +
    `T${pad(moment.getUTCHours())}${pad(moment.getUTCMinutes())}00`
  );
}

function utcStamp(moment: Date): string {
  return moment.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

interface CalendarEntry {
  clinic: Clinic;
  /** Title of the entry, already in the person's language. */
  title: string;
  /** Extra line, for example the vaccines requested. */
  description: string;
  /** Unique id, for example the confirmation id. */
  uid: string;
  now: Date;
}

export function buildCalendarFile({ clinic, title, description, uid, now }: CalendarEntry): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OneCare//Vaccine sign-up//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeText(uid)}@onecare`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=${clinic.timeZone}:${localStamp(clinic.date, clinic.time)}`,
    `DTEND;TZID=${clinic.timeZone}:${localStamp(clinic.date, clinic.time, CALENDAR_ENTRY_MINUTES)}`,
    `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(`${clinic.pharmacy.name}, ${clinic.address}`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
