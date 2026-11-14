import { formatClinicDate, formatClinicTime, useI18n } from '../i18n';
import { useSignup } from '../state';

export interface ClinicText {
  pharmacy: string;
  /** "Tue, Dec 1, 2026 at 10:00 AM" */
  when: string;
  /** Pharmacy name and clinic address on one line. */
  where: string;
  /** "Need help? Call ..." */
  help: string;
}

/** The clinic lines both shells show, in the chosen language. Null while the clinic loads. */
export function useClinicText(): ClinicText | null {
  const { state } = useSignup();
  const { t, language } = useI18n();
  const { clinic } = state;
  if (!clinic) return null;
  const pharmacy = clinic.pharmacy.name;
  return {
    pharmacy,
    when: t('clinic.dateAtTime', {
      date: formatClinicDate(clinic.date, language),
      time: formatClinicTime(clinic.time, language),
    }),
    where: t('clinic.where', { pharmacy, address: clinic.address }),
    help: t('help.call', { pharmacy, phone: clinic.pharmacy.phone }),
  };
}
