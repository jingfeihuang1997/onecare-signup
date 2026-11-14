import type { AppConfig } from '../app/config';
import { isSectionComplete, type SignupState } from '../state';
import type { SectionId } from '../types';

/**
 * Whether a section shows as done in a shell: the person moved on from it and what it
 * holds is valid. Sign is done once the sign-up was sent.
 */
export function sectionDone(state: SignupState, section: SectionId, config: AppConfig): boolean {
  return isSectionComplete(state, section, config);
}
