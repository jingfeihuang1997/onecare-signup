import { useI18n } from '../i18n';

interface SignatureBoxProps {
  /** The typed name, drawn in the script font as the signature (SPEC 5.7). */
  name: string;
}

/** Preview of a typed signature. The Draw canvas arrives with the Sign section. */
export function SignatureBox({ name }: SignatureBoxProps) {
  const { t } = useI18n();
  const trimmed = name.trim();
  return (
    <div
      className="oc-sign"
      role="img"
      aria-label={trimmed ? t('sign.typedPreview', { name: trimmed }) : t('sign.empty')}
    >
      <span className="oc-sign__typed">{trimmed}</span>
    </div>
  );
}
