import type { SectionId } from '../types';
import { ExtrasSection } from './ExtrasSection';
import { HelperSection } from './HelperSection';
import { InsuranceSection } from './InsuranceSection';
import { PatientSection } from './PatientSection';
import { SignSection } from './SignSection';
import { VaccinesSection } from './VaccinesSection';

/** The body of one section. Both shells render sections only through this. */
export function SectionView({ section }: { section: SectionId }) {
  switch (section) {
    case 'patient':
      return <PatientSection />;
    case 'helper':
      return <HelperSection />;
    case 'vaccines':
      return <VaccinesSection />;
    case 'insurance':
      return <InsuranceSection />;
    case 'extras':
      return <ExtrasSection />;
    case 'sign':
      return <SignSection />;
  }
}
