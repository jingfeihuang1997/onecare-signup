import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { TEXT_SIZE_STEPS, TextSizeContext, type TextSizeValue } from './textSize';

interface Props {
  /** Index into TEXT_SIZE_STEPS to start from. */
  initialStep?: number;
  children: ReactNode;
}

const LAST = TEXT_SIZE_STEPS.length - 1;

/** Steps the root font size, so every rem-based size in onecare.css follows. */
export function TextSizeProvider({ initialStep = 0, children }: Props) {
  const [step, setStep] = useState(() => Math.min(Math.max(initialStep, 0), LAST));
  const percent = TEXT_SIZE_STEPS[step] ?? TEXT_SIZE_STEPS[0];

  useEffect(() => {
    document.documentElement.style.fontSize = `${percent}%`;
  }, [percent]);

  const value = useMemo<TextSizeValue>(
    () => ({
      percent,
      canDecrease: step > 0,
      canIncrease: step < LAST,
      decrease: () => setStep((current) => Math.max(current - 1, 0)),
      increase: () => setStep((current) => Math.min(current + 1, LAST)),
    }),
    [percent, step],
  );

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}
