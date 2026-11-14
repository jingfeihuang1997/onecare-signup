import { useI18n } from '../i18n';
import { cx } from './cx';
import { Icon } from './Icon';

interface ProgressBarProps {
  /** 1-based number of the section the person is on. */
  current: number;
  total: number;
  /** Name of the current section. */
  name: string;
  onOpenSections: () => void;
  /** Hidden from 900px, where the side list takes over. */
  narrowOnly?: boolean;
}

/** Option A: sticky bar with one segment per section and the "Sections" button. */
export function ProgressBar({
  current,
  total,
  name,
  onOpenSections,
  narrowOnly = false,
}: ProgressBarProps) {
  const { t } = useI18n();
  return (
    <nav className={cx('oc-progress', narrowOnly && 'oc-narrow-only')} aria-label={t('progress.label')}>
      <div className="oc-progress__main">
        <div className="oc-progress__segs" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span key={index} className={cx('oc-progress__seg', index < current && 'is-done')} />
          ))}
        </div>
        <span className="oc-progress__label">
          {t('progress.sectionNamed', { current, total, name })}
        </span>
      </div>
      <button
        type="button"
        className="oc-btn oc-btn--small"
        aria-haspopup="dialog"
        onClick={onOpenSections}
      >
        <Icon name="list" size={20} />
        {t('progress.sections')}
      </button>
    </nav>
  );
}
