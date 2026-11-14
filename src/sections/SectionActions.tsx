import { useContext } from 'react';
import { Actions, Button } from '../components';
import { useI18n } from '../i18n';
import { ShellActionsContext } from './shellActions';

interface SectionActionsProps {
  /** Runs first, for example to validate. Resolve to false to stay on the section. */
  beforeContinue?: () => boolean | Promise<boolean>;
  /** Replaces the label the shell gives the primary button. */
  label?: string;
  /** Disables the primary button while something is in flight. */
  busy?: boolean;
}

/** The bottom row of a section: Back (when the shell offers it) and the primary button. */
export function SectionActions({ beforeContinue, label, busy = false }: SectionActionsProps) {
  const shell = useContext(ShellActionsContext);
  const { t } = useI18n();
  if (!shell) return null;
  return (
    <Actions>
      {shell.onBack ? <Button onClick={shell.onBack}>{t('common.back')}</Button> : null}
      <Button
        variant="primary"
        grow
        disabled={busy}
        onClick={() => {
          void Promise.resolve(beforeContinue ? beforeContinue() : true).then((ok) => {
            if (ok) shell.onContinue();
          });
        }}
      >
        {label ?? shell.continueLabel}
      </Button>
    </Actions>
  );
}
