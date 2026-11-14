import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])';

/**
 * Modal sheet that rises from the bottom (the section list in option A).
 * Rendered in place, not in a portal, so it keeps the theme of its .oc root.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const { t } = useI18n();
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      document.body.style.overflow = bodyOverflow;
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    // Keep Tab inside the sheet while it is open.
    const focusable = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === titleRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      {/* Tapping outside closes the sheet. Keyboard users have Escape and the Close button. */}
      <div className="oc-scrim" aria-hidden="true" onClick={onClose} />
      {/* The dialog listens for Escape and Tab; the controls inside it stay real buttons. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="oc-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className="oc-sheet__grip" aria-hidden="true" />
        <div className="oc-sheet__top">
          <h2 className="oc-h2" id={titleId} ref={titleRef} tabIndex={-1}>
            {title}
          </h2>
          <button type="button" className="oc-iconbtn" aria-label={t('sheet.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
