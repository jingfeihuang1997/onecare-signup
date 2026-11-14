import { cx } from './cx';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Language of the label when it differs from the page, for example "Español". */
  lang?: string;
}

interface SegmentedProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** Two or three choices side by side: language, Yes / No / Not sure, Type / Draw. */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="oc-seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx('oc-seg__opt', option.value === value && 'is-on')}
          aria-pressed={option.value === value}
          lang={option.lang}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
