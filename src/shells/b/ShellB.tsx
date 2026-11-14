import { useEffect, useMemo, useRef } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Header,
  Pass,
  PassPart,
  ReviewList,
  Stamps,
  SubHeadingContext,
  WhyWeAsk,
  type StampItem,
} from '../../components';
import { CopyVariantContext, useI18n, type Translate } from '../../i18n';
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
import type { AppConfig } from '../../app/config';
import {
  hasHelper,
  nextSection,
  patientCallName,
  patientFullName,
  sectionList,
  sectionSummary,
  useSignup,
  type SignupState,
} from '../../state';
import { getVaccine } from '../../data/vaccines';
import type { SectionId } from '../../types';
import { Started } from '../Started';
import { TopBar } from '../TopBar';
import { useDocumentTitle } from '../useDocumentTitle';
import { useFocusOnChange } from '../useFocusOnChange';

// Option B, "Clinic pass": one step per route, Back and a primary button at the bottom,
// and a pass that collects a stamp for each step.

const START = '/b';
const DONE = '/b/done';

function stepPath(section: SectionId): string {
  return `/b/${section}`;
}

type Position = 'start' | SectionId | 'done';

// The five stamps. "Who" covers the patient and, on the helper path, "And who are you?".
const STAMPS = [
  { id: 'who', label: 'stamp.who', mark: '1', sections: ['patient', 'helper'] },
  { id: 'shots', label: 'stamp.shots', mark: '2', sections: ['vaccines'] },
  { id: 'card', label: 'stamp.card', mark: '3', sections: ['insurance'] },
  { id: 'extras', label: 'stamp.extras', mark: '+', sections: ['extras'] },
  { id: 'sign', label: 'stamp.sign', mark: '4', sections: ['sign'] },
] as const satisfies readonly { id: string; label: string; mark: string; sections: readonly SectionId[] }[];

function stampItems(state: SignupState, config: AppConfig, position: Position, t: Translate): StampItem[] {
  const present = sectionList(state);
  return STAMPS.map((stamp) => {
    const sections = stamp.sections.filter((section) => present.includes(section));
    const isCurrent =
      position === 'start' ? stamp.id === 'who' : sections.some((section) => section === position);
    const isDone =
      position === 'done' || sections.every((section) => sectionDone(state, section, config));
    return {
      id: stamp.id,
      label: t(stamp.label),
      mark: stamp.mark,
      state: isCurrent ? 'current' : isDone ? 'done' : 'todo',
    };
  });
}

/** The pass as it fills in: who it is for, when, the stamps, and the shots picked so far. */
function PassCard({ position }: { position: Position }) {
  const { t } = useI18n();
  const { state, config } = useSignup();
  const clinic = useClinicText();
  if (!clinic) return null;
  const name = patientFullName(state.draft);
  const shots = state.draft.vaccines.selections
    .map((selection) => getVaccine(selection.vaccineId))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((vaccine) => t(`vaccine.${vaccine.id}.short`))
    .join(t('common.separator'));
  return (
    <Pass>
      <PassPart label={t('pass.label')} title={name || clinic.when}>
        {name ? <strong>{clinic.when}</strong> : null}
        <span>{clinic.where}</span>
      </PassPart>
      {position === 'start' ? (
        <PassPart>
          <span>{t('b.start.passNote')}</span>
        </PassPart>
      ) : (
        <PassPart>
          <Stamps flat items={stampItems(state, config, position, t)} />
        </PassPart>
      )}
      {position === 'done' ? (
        <PassPart>
          <span className="oc-card__kicker">{t('done.vaccinesRequested')}</span>
          <VaccinesRequested draft={state.draft} />
        </PassPart>
      ) : shots ? (
        <PassPart>
          <span className="oc-card__kicker">{t('b.pass.shots')}</span>
          <span>{shots}</span>
        </PassPart>
      ) : null}
    </Pass>
  );
}

function StartB() {
  const { t } = useI18n();
  const { state, config } = useSignup();
  const navigate = useNavigate();
  const clinic = useClinicText();
  useDocumentTitle(clinic ? t('page.title', { page: t('page.start'), pharmacy: clinic.pharmacy }) : '');
  return (
    <>
      <TopBar>
        <Header pharmacyName={clinic?.pharmacy ?? ''} showLanguage={false} />
        <Stamps items={stampItems(state, config, 'start', t)} />
      </TopBar>
      <main className="oc-main">
        <h1 className="oc-h1">{t('b.start.title')}</h1>
        <PassCard position="start" />
        <LanguagePicker />
        <StartSection titleSize="normal" onOpen={(section) => navigate(stepPath(section))} />
        {clinic ? <p className="oc-small">{clinic.help}</p> : null}
      </main>
    </>
  );
}

function StepB() {
  const { t, language } = useI18n();
  const { state, dispatch, config } = useSignup();
  const navigate = useNavigate();
  const params = useParams();
  const clinic = useClinicText();
  const heading = useRef<HTMLHeadingElement>(null);
  const [search] = useSearchParams();
  const healthView = params.section === 'extras' && search.get('view') === 'health';
  const returnTo = search.get('return');

  const sections = sectionList(state);
  const step = sections.find((section) => section === params.section) ?? null;
  const { currentSection } = state.draft;

  useEffect(() => {
    if (step && currentSection !== step) dispatch({ type: 'section/open', section: step });
  }, [step, currentSection, dispatch]);

  useFocusOnChange(step ? `${step}${healthView ? '/health' : ''}` : null, () => heading.current);

  const actions = useMemo<ShellActions | null>(() => {
    if (!step) return null;
    const list = sectionList(state);
    const previous = list[list.indexOf(step) - 1];
    const next = nextSection(state, step);
    const callName = patientCallName(state.draft);
    const submitLabel =
      hasHelper(state) && callName ? t('sign.submitNamed', { name: callName }) : t('sign.submit');
    // On Sign, the earlier steps as a list: tapping a row opens that step and comes back.
    const labels: Record<SectionId, string> = {
      patient: t('stamp.who'),
      helper: t('review.you'),
      vaccines: t('stamp.shots'),
      insurance: t('stamp.card'),
      extras: t('stamp.extras'),
      sign: t('stamp.sign'),
    };
    const reviewList =
      step === 'sign' ? (
        <ReviewList
          rows={list
            .filter((section) => section !== 'sign')
            .map((section) => ({
              id: section,
              label: labels[section],
              value: sectionSummary(state, section, t, language),
              onClick: () => navigate(`${stepPath(section)}?return=sign`),
            }))}
        />
      ) : undefined;
    return {
      continueLabel: step === 'sign' ? submitLabel : t('common.continue'),
      onContinue: () => {
        dispatch({ type: 'section/continue', section: step });
        if (returnTo === 'sign' && step !== 'sign') navigate(stepPath('sign'));
        else if (returnTo === 'done' && step !== 'sign') navigate(DONE);
        else navigate(next ? stepPath(next) : DONE);
      },
      onBack: () => navigate(previous ? stepPath(previous) : START),
      titlesSubViews: true,
      reviewList,
    };
  }, [step, state, t, language, dispatch, navigate, returnTo]);

  useDocumentTitle(
    clinic && step ? t('page.title', { page: t(`section.${step}`), pharmacy: clinic.pharmacy }) : '',
  );

  // A step that does not exist on this path, for example "And who are you?" for "Me".
  if (!step) return <Navigate to={stepPath('patient')} replace />;

  const name = patientCallName(state.draft);
  const { lookup, forWhom } = state.draft;
  const confirming = step === 'patient' && lookup.status === 'found' && !lookup.confirmed;
  const title = healthView
    ? forWhom === 'self'
      ? t('b.heading.health.self')
      : t('b.heading.health', { name })
    : confirming
    ? forWhom === 'self'
      ? t('b.heading.patientFound.self')
      : t('b.heading.patientFound', { name })
    : step === 'vaccines'
      ? name
        ? t('b.heading.vaccines', { name })
        : t('b.heading.vaccinesNoName')
      : t(`b.heading.${step}`);

  return (
    <>
      <TopBar>
        <Header pharmacyName={clinic?.pharmacy ?? ''} />
        <Stamps narrowOnly items={stampItems(state, config, step, t)} />
      </TopBar>
      <div className="oc-layout">
        <aside className="oc-aside">
          <PassCard position={step} />
          {clinic ? <p className="oc-small">{clinic.help}</p> : null}
        </aside>
        <main className="oc-content">
          <h1 className="oc-h1" tabIndex={-1} ref={heading}>
            {title}
          </h1>
          <WhyWeAsk>{sectionWhy(step)}</WhyWeAsk>
          <ShellActionsContext.Provider value={actions}>
            <SectionView section={step} />
          </ShellActionsContext.Provider>
        </main>
      </div>
    </>
  );
}

function DoneB() {
  const { t } = useI18n();
  const { state } = useSignup();
  const navigate = useNavigate();
  const clinic = useClinicText();
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusOnChange('done', () => heading.current);
  useDocumentTitle(clinic ? t('page.title', { page: t('page.done'), pharmacy: clinic.pharmacy }) : '');

  // The finished pass is only for a sign-up that was sent.
  if (!state.draft.confirmationId) return <Navigate to={stepPath('sign')} replace />;
  return (
    <>
      <TopBar>
        <Header pharmacyName={clinic?.pharmacy ?? ''} />
      </TopBar>
      <main className="oc-main">
        <h1 className="oc-h1" tabIndex={-1} ref={heading}>
          {hasHelper(state) ? t('done.title', { name: patientCallName(state.draft) }) : t('done.title.self')}
        </h1>
        <PassCard position="done" />
        <DoneSection
          onAnother={() => navigate(START)}
          onOpenExtras={() => navigate(`${stepPath('extras')}?return=done`)}
        />
      </main>
    </>
  );
}

export function ShellB() {
  return (
    <CopyVariantContext.Provider value="pass">
      <SubHeadingContext.Provider value={2}>
      <div className="oc oc--b oc--page">
        <Routes>
          <Route index element={<StartB />} />
          <Route
            path="done"
            element={
              <Started start={START}>
                <DoneB />
              </Started>
            }
          />
          <Route
            path=":section"
            element={
              <Started start={START}>
                <StepB />
              </Started>
            }
          />
          <Route path="*" element={<Navigate to={START} replace />} />
        </Routes>
      </div>
      </SubHeadingContext.Provider>
    </CopyVariantContext.Provider>
  );
}
