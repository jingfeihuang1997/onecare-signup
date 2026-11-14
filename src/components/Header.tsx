import { useEffect, useId, useRef, useState } from 'react';
import { useTextSize } from '../app/textSize';
import { LANGUAGES, useI18n } from '../i18n';
import { cx } from './cx';
import { Icon } from './Icon';

interface HeaderProps {
  pharmacyName: string;
  /** The Start screen offers the language in the page instead, so it hides this button. */
  showLanguage?: boolean;
}

/** Pharmacy name, OneCare credit, language menu and the A− / A+ text-size buttons. */
export function Header({ pharmacyName, showLanguage = true }: HeaderProps) {
  const { t, language, setLanguage } = useI18n();
  const textSize = useTextSize();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const languageRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !languageRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="oc-header">
      <div className="oc-brand">
        <span className="oc-brand__name">{pharmacyName}</span>
        <span className="oc-brand__by">
          {t('header.poweredBy')}
          <span className="oc-logo" role="img" aria-label={t('header.logoAlt')}>
            {t('header.logoPlaceholder')}
          </span>
          <strong>{t('brand.name')}</strong>
        </span>
      </div>
      <div className="oc-tools" ref={languageRef}>
        {showLanguage ? (
          <>
            <button
              type="button"
              className="oc-iconbtn"
              ref={toggleRef}
              aria-label={t('header.language', { language: t(`language.${language}`) })}
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? menuId : undefined}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {t(`language.short.${language}`)}
            </button>
            {menuOpen ? (
              <div className="oc-menu" id={menuId} role="group" aria-label={t('header.languageMenu')}>
                {LANGUAGES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cx('oc-menu__item', option === language && 'is-on')}
                    aria-pressed={option === language}
                    lang={option}
                    onClick={() => {
                      setLanguage(option);
                      setMenuOpen(false);
                      toggleRef.current?.focus();
                    }}
                  >
                    {t(`language.${option}`)}
                    {option === language ? <Icon name="check" size={18} strokeWidth={3} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        <button
          type="button"
          className="oc-iconbtn"
          aria-label={t('header.smallerText')}
          disabled={!textSize.canDecrease}
          onClick={textSize.decrease}
        >
          {t('header.smallerGlyph')}
        </button>
        <button
          type="button"
          className="oc-iconbtn oc-iconbtn--lg"
          aria-label={t('header.largerText')}
          disabled={!textSize.canIncrease}
          onClick={textSize.increase}
        >
          {t('header.largerGlyph')}
        </button>
      </div>
    </header>
  );
}
