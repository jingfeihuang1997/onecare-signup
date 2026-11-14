import { createContext, type ReactNode } from 'react';

/**
 * What the shell gives a section for its bottom row of buttons. Option A supplies only
 * Continue; option B also supplies Back. The section never learns which option it is in.
 */
export interface ShellActions {
  continueLabel: string;
  onContinue: () => void;
  onBack?: () => void;
  /**
   * True when the shell shows the title of a section's sub-view itself (option B does, as
   * the step heading), so the section does not repeat it.
   */
  titlesSubViews?: boolean;
  /**
   * The review of the earlier sections, for the Sign section to show. Option B supplies a
   * list; in option A the folded panels above are the review, so it supplies nothing.
   */
  reviewList?: ReactNode;
}

export const ShellActionsContext = createContext<ShellActions | null>(null);
