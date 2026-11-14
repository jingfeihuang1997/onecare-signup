import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { TEXT_SIZE_STEPS, TextSizeContext, type TextSizeValue } from './textSize';

interface Props {
  /** Index into TEXT_SIZE_STEPS to start from. */
  initialStep?: number;
  /** Called when the person presses A− or A+, so the choice can be remembered. */
  onChange?: (step: number) => void;
  children: ReactNode;
}

const LAST = TEXT_SIZE_STEPS.length - 1;

function clamp(step: number): number {
  return Number.isInteger(step) ? Math.min(Math.max(step, 0), LAST) : 0;
}

/** Steps the root font size, so every rem-based size in onecare.css follows. */
export function TextSizeProvider({ initialStep = 0, onChange, children }: Props) {
  const [step, setStep] = useState(() => clamp(initialStep));
  const percent = TEXT_SIZE_STEPS[step] ?? TEXT_SIZE_STEPS[0];

  useEffect(() => {
    document.documentElement.style.fontSize = `${percent}%`;
  }, [percent]);

  const value = useMemo<TextSizeValue>(() => {
    const go = (delta: number) => {
      const next = clamp(step + delta);
      if (next === step) return;
      setStep(next);
      onChange?.(next);
    };
    return {
      percent,
      canDecrease: step > 0,
      canIncrease: step < LAST,
      decrease: () => go(-1),
      increase: () => go(1),
    };
  }, [percent, step, onChange]);

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}
