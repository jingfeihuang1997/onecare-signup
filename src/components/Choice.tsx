import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

interface ChoiceText {
  title?: ReactNode;
  sub?: ReactNode;
  /** Longer text under the title, such as consent wording with a link. */
  children?: ReactNode;
  /** Larger tile, used for the main choices on Start. */
  big?: boolean;
}

interface NavChoiceProps extends ChoiceText {
  kind: 'nav';
  onClick: () => void;
}

interface InputChoiceProps extends ChoiceText {
  kind: 'radio' | 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Radio group name. */
  name?: string;
  value?: string;
  /** Aligns the box with the first line when the text is long. */
  top?: boolean;
  disabled?: boolean;
}

export type ChoiceProps = NavChoiceProps | InputChoiceProps;

function Text({ title, sub, children }: ChoiceText) {
  return (
    <span className="oc-choice__text">
      {title ? <span className="oc-choice__title">{title}</span> : null}
      {sub ? <span className="oc-choice__sub">{sub}</span> : null}
      {children ? <span>{children}</span> : null}
    </span>
  );
}

/** Choice tile: a radio, a checkbox, or a button that moves on (with a chevron). */
export function Choice(props: ChoiceProps) {
  if (props.kind === 'nav') {
    return (
      <button
        type="button"
        className={cx('oc-choice', props.big && 'oc-choice--big')}
        onClick={props.onClick}
      >
        <Text title={props.title} sub={props.sub}>
          {props.children}
        </Text>
        <span className="oc-chev">
          <Icon name="chevronRight" size={24} />
        </span>
      </button>
    );
  }
  return (
    <label
      className={cx(
        'oc-choice',
        props.big && 'oc-choice--big',
        props.top && 'oc-choice--top',
        props.checked && 'is-selected',
      )}
    >
      <input
        type={props.kind}
        name={props.name}
        value={props.value}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <Text title={props.title} sub={props.sub}>
        {props.children}
      </Text>
    </label>
  );
}
