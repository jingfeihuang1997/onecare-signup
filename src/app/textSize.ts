import { createContext, useContext } from 'react';

/** Root font size steps for the A− and A+ buttons (SPEC 4.5). */
export const TEXT_SIZE_STEPS = [100, 112, 125, 140] as const;

export interface TextSizeValue {
  /** Current root font size in percent. */
  percent: number;
  canDecrease: boolean;
  canIncrease: boolean;
  decrease: () => void;
  increase: () => void;
}

export const TextSizeContext = createContext<TextSizeValue>({
  percent: TEXT_SIZE_STEPS[0],
  canDecrease: false,
  canIncrease: false,
  decrease: () => undefined,
  increase: () => undefined,
});

export function useTextSize(): TextSizeValue {
  return useContext(TextSizeContext);
}
