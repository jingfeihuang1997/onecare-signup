import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** "primary" is the filled main action; "link" looks like underlined text. */
  variant?: 'default' | 'primary' | 'link';
  small?: boolean;
  /** Takes the free width in an Actions row. */
  grow?: boolean;
  icon?: IconName;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', small = false, grow = false, icon, type = 'button', children, ...button },
  ref,
) {
  return (
    <button
      {...button}
      ref={ref}
      type={type}
      className={cx(
        'oc-btn',
        variant === 'primary' && 'oc-btn--primary',
        variant === 'link' && 'oc-btn--link',
        small && 'oc-btn--small',
        grow && 'oc-btn--grow',
      )}
    >
      {icon ? <Icon name={icon} size={small ? 20 : 22} /> : null}
      {children}
    </button>
  );
});

/** A row of buttons, for example Back and Continue. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="oc-actions">{children}</div>;
}
