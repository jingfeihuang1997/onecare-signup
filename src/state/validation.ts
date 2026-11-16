// Format checks shared by the selectors and, later, the field error messages.

export function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

/** Names start with a capital letter. Only the first letter changes: "de la Cruz" keeps its small words after it. */
export function capitalizeFirst(value: string): string {
  const start = value.search(/\S/);
  if (start === -1) return value;
  return value.slice(0, start) + value.charAt(start).toLocaleUpperCase() + value.slice(start + 1);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** A US phone number: ten digits, with or without a leading 1 and any punctuation. */
export function isUsPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

/** A Medicare number has 11 letters and digits. Dashes and spaces are ignored. */
export function isMedicareNumber(value: string): boolean {
  return /^[A-Za-z0-9]{11}$/.test(value.replace(/[\s-]/g, ''));
}

/** Shows a Medicare number as the card does: 1EG4-TE5-MK73. Keeps at most 11 characters. */
export function formatMedicareNumber(value: string): string {
  const plain = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 11);
  return [plain.slice(0, 4), plain.slice(4, 7), plain.slice(7)].filter(Boolean).join('-');
}

export function isSsnLast4(value: string): boolean {
  return /^\d{4}$/.test(value.trim());
}
