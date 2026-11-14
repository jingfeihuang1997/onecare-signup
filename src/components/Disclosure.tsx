import { useId, useState, type ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

interface DisclosureProps {
  label: string;
  /** No line above the row. */
  plain?: boolean;
  children: ReactNode;
}

/** A row that reveals more text. It always starts folded (SPEC 4.2), so there is no "open" prop. */
export function Disclosure({ label, plain = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        className={cx('oc-disc', plain && 'oc-disc--plain')}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <Icon name={open ? 'chevronUp' : 'chevronDown'} />
      </button>
      {open ? (
        <div className="oc-disc__panel" id={panelId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
