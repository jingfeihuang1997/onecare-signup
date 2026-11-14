import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BottomSheet,
  Card,
  Header,
  Icon,
  Panel,
  ProgressBar,
  SectionNav,
  type SectionNavItem,
} from '../../components';
import { useI18n } from '../../i18n';
import {
  DoneSection,
  LanguagePicker,
  SectionView,
  ShellActionsContext,
  StartSection,
  VaccinesRequested,
  sectionDone,
  sectionWhy,
  useClinicText,
  type ShellActions,
} from '../../sections';
import {
  hasHelper,
  nextSection,
  patientCallName,
  patientFullName,
  sectionList,
  sectionSummary,
  useSignup,
} from '../../state';
import type { SectionId } from '../../types';
import { Started } from '../Started';
import { TopBar } from '../TopBar';
import { useDocumentTitle } from '../useDocumentTitle';
import { useFocusOnChange } from '../useFocusOnChange';

// Option A, "Calm and clear": one page, a panel per section, a finished panel folds into
// its summary. The open panel is in the URL, so Back, refresh and deep links work.

const START = '/a';
const SIGNUP = '/a/signup';
const DONE = '/a/done';

function sectionPath(section: SectionId): string {
  return `${SIGNUP}/${section}`;
}

function ClinicCard({ showPatient = false }: { showPatient?: boolean }) {
  const { t } = useI18n();
  const { state } = useSignup();
  const clinic = useClinicText();
  const name = patientFullName(state.draft);
  if (!clinic) return null;
  return (
    <Card kicker={t('clinic.kicker')} title={clinic.when}>
      <span>{clinic.where}</span>
      {showPatient && name ? <span>{t('aside.signingUp', { name })}</span> : null}
    </Card>
  );
}

function StartA() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const clinic = useClinicText();
  useDocumentTitle(clinic ? t('page.title', { page: t('page.start'), pharmacy: clinic.pharmacy }) : '');
  return (
    <>
      <TopBar>
        <Header pharmacyName={clinic?.pharmacy ?? ''} showLanguage={false} />
      </TopBar>
      <main className="oc-main">
        <h1 className="oc-sr">{t('page.signup')}</h1>
        <LanguagePicker />
        <ClinicCard />
        <StartSection titleSize="large" onOpen={(section) => navigate(sectionPath(section))} />
        {clinic ? <p className="oc-small">{clinic.help}</p> : null}
      </main>
    </>
  );
}

function PanelsA() {
  const { t, language } = useI18n();
  const { state, dispatch, config } = useSignup();
  const navigate = useNavigate();
  const params = useParams();
  const [search] = useSearchParams();
  const returnTo = search.get('return');
  const clinic = useClinicText();
  const [sheetOpen, setSheetOpen] = useState(false);
  const heads = useRef(new Map<SectionId, HTMLButtonElement>());

  const sections = sectionList(state);
  const open = sections.find((section) => section === params.section) ?? null;
  const { currentSection } = state.draft;

  // The URL decides which panel is open; the draft remembers it as "where you stopped".
  useEffect(() => {
    if (open && currentSection !== open) dispatch({ type: 'section/open', section: open });
  }, [open, currentSection, dispatch]);

  useFocusOnChange(open, () => (open ? heads.current.get(open) : null));

  const actions = useMemo<ShellActions | null>(() => {
    if (!open) return null;
    const next = nextSection(state, open);
    const name = patientCallName(state.draft);
    const submitLabel = hasHelper(state) && name ? t('sign.submitNamed', { name }) : t('sign.submit');
    return {
      continueLabel: open === 'sign' ? submitLabel : t('common.continue'),
      onContinue: () => {
        dispatch({ type: 'section/continue', section: open });
        // A "Still open" row on Done leads here and back again.
        if (returnTo === 'done' && open !== 'sign') navigate(DONE);
        else navigate(next ? sectionPath(next) : DONE);
      },
    };
  }, [open, state, t, dispatch, navigate, returnTo]);

  const shown = open ?? sections.find((section) => section === currentSection) ?? sections[0];
  useDocumentTitle(
    clinic && shown ? t('page.title', { page: t(`section.${shown}`), pharmacy: clinic.pharmacy }) : '',
  );

  // A section that does not exist on this path, for example "Your details" for "Myself".
  if (params.section && !open) return <Navigate to={SIGNUP} replace />;

  const shownIndex = shown ? sections.indexOf(shown) : 0;

  const navItems = (withState: boolean): SectionNavItem[] =>
    sections.map((section, index) => {
      const done = sectionDone(state, section, config);
      const current = section === shown;
      const label = current
        ? t('nav.state.current')
        : done
          ? t('nav.state.done')
          : section === 'extras'
            ? t('nav.state.optional')
            : t('nav.state.todo');
      return {
        id: section,
        number: index + 1,
        label: t(`section.${section}`),
        state: current ? 'current' : done ? 'done' : 'todo',
        stateLabel: withState ? label : undefined,
      };
    });

  const goTo = (id: string) => {
    const section = sections.find((item) => item === id);
    setSheetOpen(false);
    if (section) navigate(sectionPath(section));
  };

  return (
    <>
      <TopBar>
      <Header pharmacyName={clinic?.pharmacy ?? ''} />
      <ProgressBar
        narrowOnly
        current={shownIndex + 1}
        total={sections.length}
        name={shown ? t(`section.${shown}`) : ''}
        onOpenSections={() => setSheetOpen(true)}
      />
      </TopBar>
      <div className="oc-layout">
        <aside className="oc-aside">
          <ClinicCard showPatient />
          <Card>
            <SectionNav items={navItems(false)} onSelect={goTo} />
          </Card>
          {clinic ? <p className="oc-small">{clinic.help}</p> : null}
        </aside>
        <main className="oc-content">
          <h1 className="oc-sr">{t('page.signup')}</h1>
          {sections.map((section, index) => (
            <Panel
              key={section}
              id={`section-${section}`}
              number={index + 1}
              title={t(`section.${section}`)}
              tag={section === 'extras' ? t('common.optional') : undefined}
              summary={sectionSummary(state, section, t, language)}
              done={sectionDone(state, section, config)}
              open={section === open}
              onToggle={() => navigate(section === open ? SIGNUP : sectionPath(section))}
              why={sectionWhy(section)}
              headRef={(element) => {
                if (element) heads.current.set(section, element);
                else heads.current.delete(section);
              }}
            >
              <ShellActionsContext.Provider value={actions}>
                <SectionView section={section} />
              </ShellActionsContext.Provider>
            </Panel>
          ))}
        </main>
      </div>
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('sheet.jumpTitle')}>
        <SectionNav items={navItems(true)} onSelect={goTo} />
      </BottomSheet>
    </>
  );
}

function DoneA() {
  const { t } = useI18n();
  const { state } = useSignup();
  const navigate = useNavigate();
  const clinic = useClinicText();
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusOnChange('done', () => heading.current);
  useDocumentTitle(clinic ? t('page.title', { page: t('page.done'), pharmacy: clinic.pharmacy }) : '');

  // Done is only for a sign-up that was sent.
  if (!state.draft.confirmationId) return <Navigate to={sectionPath('sign')} replace />;
  const name = patientCallName(state.draft);
  return (
    <>
      <TopBar>
        <Header pharmacyName={clinic?.pharmacy ?? ''} />
      </TopBar>
      <main className="oc-main">
        <div className="oc-done">
          <span className="oc-done__mark" aria-hidden="true">
            <Icon name="check" size={28} strokeWidth={3} />
          </span>
          <h1 className="oc-h1" tabIndex={-1} ref={heading}>
            {hasHelper(state) ? t('done.title', { name }) : t('done.title.self')}
          </h1>
        </div>
        {clinic ? (
          <Card kicker={t('clinic.kicker')} title={clinic.when}>
            <span>{clinic.where}</span>
            <span className="oc-card__kicker">{t('done.vaccinesRequested')}</span>
            <VaccinesRequested draft={state.draft} />
          </Card>
        ) : null}
        <DoneSection
          onAnother={() => navigate(START)}
          onOpenExtras={() => navigate(`${sectionPath('extras')}?return=done`)}
        />
      </main>
    </>
  );
}

export function ShellA() {
  return (
    <div className="oc oc--a oc--page">
      <Routes>
        <Route index element={<StartA />} />
        <Route
          path="signup/:section?"
          element={
            <Started start={START}>
              <PanelsA />
            </Started>
          }
        />
        <Route
          path="done"
          element={
            <Started start={START}>
              <DoneA />
            </Started>
          }
        />
        <Route path="*" element={<Navigate to={START} replace />} />
      </Routes>
    </div>
  );
}
