import { useState } from 'react';
import { Button, Card, ReviewList } from '../components';
import { getVaccine } from '../data/vaccines';
import { HEALTH_QUESTION_KEYS } from '../data/healthQuestions';
import { useI18n, type StringKey } from '../i18n';
import { buildCalendarFile, patientCallName, stillOpen, useSignup } from '../state';
import type { ExtrasItem, SignupDraft } from '../types';
import { focusSoon } from './focusSoon';
import { useClinicText } from './useClinicText';

const OPEN_ROWS: Record<ExtrasItem, { label: StringKey; value: StringKey }> = {
  health: { label: 'extras.health.title', value: 'done.open.health' },
  more: { label: 'done.open.moreLabel', value: 'done.open.more' },
  address: { label: 'patient.review.address', value: 'extras.address.todo' },
  reminders: { label: 'extras.reminders.title', value: 'done.open.reminders' },
};

/** The vaccines of a sign-up, one per line: "Flu", then the product or "pharmacist will confirm". */
export function VaccinesRequested({ draft }: { draft: SignupDraft }) {
  const { t } = useI18n();
  const lines = draft.vaccines.selections
    .map((selection) => ({ selection, vaccine: getVaccine(selection.vaccineId) }))
    .sort((a, b) => a.vaccine.displayOrder - b.vaccine.displayOrder);
  if (lines.length === 0) return <span>{t('done.vaccinesNotSure')}</span>;
  return (
    <>
      {lines.map(({ selection, vaccine }) => {
        const choice = selection.product;
        const product =
          choice?.kind === 'product'
            ? vaccine.products.find((item) => item.id === choice.productId)?.name
            : undefined;
        return (
          <span key={vaccine.id}>
            <strong>{t(`vaccine.${vaccine.id}.short`)}</strong>
            {t('common.separator')}
            {product ?? t('done.pharmacistConfirms')}
          </span>
        );
      })}
    </>
  );
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

interface DoneSectionProps {
  /** "Sign up another person": the shell goes back to its Start screen. */
  onAnother: () => void;
  /** A "Still open" row was tapped: the shell opens the optional section. */
  onOpenExtras: () => void;
}

/**
 * Done (SPEC 5.8), below the confirmation each shell draws in its own way: add to
 * calendar, sign up another person, what is still open, and the device-memory notice.
 */
export function DoneSection({ onAnother, onOpenExtras }: DoneSectionProps) {
  const { t } = useI18n();
  const { state, dispatch, memory } = useSignup();
  const clinic = useClinicText();
  const [forgotten, setForgotten] = useState(false);
  const { draft } = state;
  const open = stillOpen(state);

  const addToCalendar = () => {
    if (!state.clinic || !clinic) return;
    const vaccines = draft.vaccines.selections
      .map((selection) => t(`vaccine.${selection.vaccineId}.short`))
      .join(', ');
    download(
      'vaccination-clinic.ics',
      buildCalendarFile({
        clinic: state.clinic,
        title: t('done.calendarTitle', { pharmacy: clinic.pharmacy }),
        description: vaccines
          ? t('done.calendarVaccines', { name: patientCallName(draft), vaccines })
          : '',
        uid: draft.confirmationId ?? draft.id,
        now: new Date(),
      }),
    );
  };

  return (
    <>
      {draft.confirmationId ? (
        <p className="oc-small">{t('done.confirmation', { id: draft.confirmationId })}</p>
      ) : null}
      <Button icon="calendar" onClick={addToCalendar}>
        {t('done.calendar')}
      </Button>
      <Button
        icon="plus"
        onClick={() => {
          dispatch({ type: 'draft/another' });
          onAnother();
        }}
      >
        {t('done.another')}
      </Button>
      {open.length > 0 ? (
        <Card gap>
          <h2 className="oc-h2">{t('done.stillOpen')}</h2>
          <p className="oc-small">{t('done.stillOpenText')}</p>
          <ReviewList
            rows={open.map((item) => ({
              id: item,
              label: t(OPEN_ROWS[item].label, { name: patientCallName(draft) }),
              value: t(OPEN_ROWS[item].value, { total: HEALTH_QUESTION_KEYS.length }),
              onClick: onOpenExtras,
            }))}
          />
        </Card>
      ) : null}
      {memory.enabled ? (
        <Card>
          {forgotten ? (
            <p className="oc-small" id="done-forgotten" tabIndex={-1}>
              {t('done.forgotten')}
            </p>
          ) : (
            <>
              <p className="oc-small">{t('done.saved')}</p>
              <Button
                variant="link"
                onClick={() => {
                  memory.forget();
                  setForgotten(true);
                  // The button is gone: move focus to the line that replaces it.
                  focusSoon('done-forgotten');
                }}
              >
                {t('welcome.forget')}
              </Button>
            </>
          )}
        </Card>
      ) : null}
    </>
  );
}
