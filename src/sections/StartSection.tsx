import { useState } from 'react';
import { Button, Card, Choice, Note, Segmented } from '../components';
import { LANGUAGES, useI18n, type Language } from '../i18n';
import { focusSoon } from './focusSoon';
import { draftFromStored, sectionList, useSignup, type StoredPatient } from '../state';
import type { SectionId } from '../types';

/** English, Español, 中文: chosen on Start, remembered, and changeable from the header later. */
export function LanguagePicker() {
  const { t, language, setLanguage } = useI18n();
  return (
    <Segmented<Language>
      label={t('language.label')}
      value={language}
      onChange={setLanguage}
      options={LANGUAGES.map((option) => ({
        value: option,
        label: t(`language.${option}`),
        lang: option,
      }))}
    />
  );
}

const TITLE_ID = 'start-title';

interface StartSectionProps {
  /** How large the question is drawn. It is always a second-level heading. */
  titleSize: 'large' | 'normal';
  /** Called with the section to open: Patient for a new sign-up, or where a draft stopped. */
  onOpen: (section: SectionId) => void;
}

/**
 * Start (SPEC 5.1): "Welcome back" first when this device holds an unfinished sign-up,
 * then "Who is this sign-up for?" with the two big choices.
 */
export function StartSection({ titleSize, onOpen }: StartSectionProps) {
  const { t } = useI18n();
  const { state, dispatch, memory, config } = useSignup();
  const [saved, setSaved] = useState(() => memory.read());

  // Unfinished sign-ups for this clinic that already have a name, newest first.
  const drafts = saved.patients
    .filter((entry) => entry.clinicToken === config.clinicToken && !entry.submitted)
    .filter((entry) => entry.firstName.trim() !== '')
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  const resume = (entry: StoredPatient) => {
    const draft = draftFromStored(entry, saved.helper);
    dispatch({ type: 'draft/restore', draft });
    const sections = sectionList({ ...state, draft });
    onOpen(sections.find((section) => section === draft.currentSection) ?? 'patient');
  };

  const forget = () => {
    memory.forget();
    dispatch({ type: 'draft/reset' });
    setSaved(memory.read());
    // The card with the button is gone: move focus to the question below it.
    focusSoon(TITLE_ID);
  };

  const choose = (forWhom: 'self' | 'other') => {
    // A new sign-up. If one was already under way it stays on this device, under "Welcome back".
    if (state.draft.forWhom !== null) dispatch({ type: 'draft/another' });
    dispatch({ type: 'start/choose', forWhom });
    // Helper details are kept on this device, so a returning helper does not retype them.
    if (forWhom === 'other' && saved.helper && state.draft.helper.firstName.trim() === '') {
      const { firstName, lastName, relationship, relationshipOther, phone, email } = saved.helper;
      dispatch({
        type: 'helper/update',
        patch: { firstName, lastName, relationship, relationshipOther, phone, email },
      });
    }
    onOpen('patient');
  };

  const title = drafts.length > 0 ? t('start.titleAgain') : t('start.title');

  return (
    <>
      {config.demoNotice ? <Note warn>{t('demo.notice')}</Note> : null}
      {drafts.length > 0 ? (
        <Card gap>
          <h2 className="oc-h2">{t('welcome.title')}</h2>
          {drafts.map((entry) => (
            <Choice
              key={entry.id}
              kind="nav"
              big
              title={
                entry.forWhom === 'self'
                  ? t('welcome.continueSelf')
                  : t('welcome.continue', { name: entry.preferredName.trim() || entry.firstName.trim() })
              }
              sub={
                entry.currentSection === 'start' || entry.currentSection === 'done'
                  ? undefined
                  : t('welcome.stoppedAt', { section: t(`section.${entry.currentSection}`) })
              }
              onClick={() => resume(entry)}
            />
          ))}
          <p className="oc-small">{t('welcome.saved')}</p>
          <Button variant="link" onClick={forget}>
            {t('welcome.forget')}
          </Button>
        </Card>
      ) : null}
      <h2 className={titleSize === 'large' ? 'oc-h1' : 'oc-h2'} id={TITLE_ID} tabIndex={-1}>
        {title}
      </h2>
      <Choice
        kind="nav"
        big
        title={t('start.self')}
        sub={t('start.selfSub')}
        onClick={() => choose('self')}
      />
      <Choice
        kind="nav"
        big
        title={t('start.other')}
        sub={t('start.otherSub')}
        onClick={() => choose('other')}
      />
    </>
  );
}
