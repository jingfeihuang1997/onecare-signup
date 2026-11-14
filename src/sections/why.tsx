import type { ReactNode } from 'react';
import type { SectionId } from '../types';
import { HelperWhy } from './HelperSection';
import { InsuranceWhy } from './InsuranceSection';
import { PatientWhy } from './PatientSection';

/**
 * The content of the "Why we ask" row a shell puts under the section title, or undefined
 * for a section that has none (then only the divider is drawn).
 */
export function sectionWhy(section: SectionId): ReactNode {
  switch (section) {
    case 'patient':
      return <PatientWhy />;
    case 'helper':
      return <HelperWhy />;
    case 'insurance':
      return <InsuranceWhy />;
    default:
      return undefined;
  }
}
