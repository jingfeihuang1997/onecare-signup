import { useState } from 'react';
import {
  Actions,
  Button,
  Choice,
  Disclosure,
  Note,
  VaccineList,
  VaccineRow,
} from '../components';
import { formatDate, formatMonthYear, useI18n, type Translate } from '../i18n';
import {
  defaultProductChoice,
  fieldRules,
  orderedProducts,
  patientCallName,
  showsProductChoice,
  useSignup,
  vaccineList,
  type VaccineListRow,
} from '../state';
import type { ProductChoice, VaccineId, VaccineProduct } from '../types';
import { focusSoon } from './focusSoon';
import { SectionActions } from './SectionActions';

function sameChoice(a: ProductChoice | null, b: ProductChoice): boolean {
  if (!a || a.kind !== b.kind) return false;
  return a.kind !== 'product' || (b.kind === 'product' && a.productId === b.productId);
}

function choiceLabel(choice: ProductChoice, products: readonly VaccineProduct[], t: Translate): string {
  if (choice.kind === 'noPreference') return t('vaccines.noPreference');
  if (choice.kind === 'askPharmacist') return t('vaccines.askPharmacist');
  return products.find((product) => product.id === choice.productId)?.name ?? '';
}

interface ProductChoiceProps {
  row: VaccineListRow;
  age: number | null;
  onChoose: (choice: ProductChoice) => void;
}

/**
 * Product choice (SPEC 5.3): the product the patient had before comes first, already
 * chosen. The rest sit under "Other options (n)", which always ends with "No preference"
 * and "I'd like to ask the pharmacist".
 */
function ProductPicker({ row, age, onChoose }: ProductChoiceProps) {
  const { t } = useI18n();
  const { vaccine, status, selection } = row;
  const chosen = selection?.product ?? null;
  const products = orderedProducts(vaccine, status);
  // Shown first: what is chosen now, else what the patient had before, else the first product.
  const first =
    products.find((product) => chosen?.kind === 'product' && product.id === chosen.productId) ??
    products[0];
  if (!first) return null;
  const others = products.filter((product) => product.id !== first.id);
  const group = `product-${vaccine.id}`;

  const sub = (product: VaccineProduct) =>
    [
      product.id === status.lastProductId ? t('vaccines.sameAsLast') : null,
      product.suggestedFromAge !== undefined && age !== null && age >= product.suggestedFromAge
        ? t('vaccines.suggestedFromAge', { age: product.suggestedFromAge })
        : null,
    ]
      .filter(Boolean)
      .join(t('common.separator')) || undefined;

  const option = (choice: ProductChoice, title: string, subtitle?: string, details?: string) => (
    <Choice
      key={choice.kind === 'product' ? choice.productId : choice.kind}
      kind="radio"
      name={group}
      top={Boolean(details)}
      title={title}
      sub={subtitle}
      checked={sameChoice(chosen, choice)}
      onChange={() => onChoose(choice)}
    >
      {details}
    </Choice>
  );
  const productOption = (item: VaccineProduct) =>
    option({ kind: 'product', productId: item.id }, item.name, sub(item), t(item.details));

  const hiddenChoice = chosen && chosen.kind !== 'product' ? choiceLabel(chosen, products, t) : null;

  return (
    <fieldset className="oc-fieldset">
      <legend className="oc-label">
        {t('vaccines.whichProduct', { vaccine: t(`vaccine.${vaccine.id}.short`) })}
      </legend>
      <span className="oc-hint">{t('vaccines.productDraft')}</span>
      {productOption(first)}
      {hiddenChoice ? <p className="oc-small">{t('vaccines.chosen', { choice: hiddenChoice })}</p> : null}
      <Disclosure plain label={t('vaccines.otherOptions', { count: others.length + 2 })}>
        <div className="oc-stack oc-stack--tight">
          {others.map(productOption)}
          {option({ kind: 'noPreference' }, t('vaccines.noPreference'))}
          {option({ kind: 'askPharmacist' }, t('vaccines.askPharmacist'))}
        </div>
      </Disclosure>
    </fieldset>
  );
}

/**
 * Vaccines (SPEC 5.3 and 10.1). Every vaccine the clinic offers is listed. The checkbox
 * adds a vaccine and opens its details; the chevron opens and folds them; one row is
 * open at a time. A folded, selected row shows its product in one line.
 */
export function VaccinesSection() {
  const { t, language } = useI18n();
  const { state, dispatch } = useSignup();
  const [expanded, setExpanded] = useState<VaccineId | null>(null);
  const [showError, setShowError] = useState(false);

  const { draft, clinic } = state;
  const self = draft.forWhom === 'self';
  const name = patientCallName(draft);
  const { age } = fieldRules(state);
  const { rows } = vaccineList(state);
  const withProducts = showsProductChoice(clinic);
  const nothingChosen = draft.vaccines.selections.length === 0 && !draft.vaccines.notSure;

  const select = (row: VaccineListRow, selected: boolean) => {
    dispatch({
      type: 'vaccines/select',
      vaccineId: row.vaccine.id,
      selected,
      product: selected ? defaultProductChoice(row.vaccine, row.status, clinic) : null,
    });
    // Adding a vaccine opens its details; removing it folds them.
    setExpanded((current) => (selected ? row.vaccine.id : current === row.vaccine.id ? null : current));
  };

  const statusLabel = (row: VaccineListRow) =>
    row.status.status === 'due'
      ? t('vax.status.due')
      : row.status.status === 'had' && row.status.lastDate
        ? t('vax.status.had', { date: formatMonthYear(row.status.lastDate, language) })
        : t('vax.status.none');

  const pickLine = (row: VaccineListRow) => {
    const choice = row.selection?.product;
    if (!choice || !withProducts) return undefined;
    const label = choiceLabel(choice, row.vaccine.products, t);
    return choice.kind === 'product' && choice.productId === row.status.lastProductId
      ? t('vaccines.pickSameAsLast', { product: label })
      : label;
  };

  /** What a selected row says without being opened: the "had it" warning and the age note. */
  const reminder = (row: VaccineListRow) => {
    const { vaccine, status, selection } = row;
    const warn = status.status === 'had' && status.lastDate && !selection?.keptAfterWarning;
    if (!warn && row.fitsAge) return undefined;
    return (
      <>
        {!row.fitsAge ? (
          <Note>{self ? t('vaccines.ageNote.self') : t('vaccines.ageNote', { name })}</Note>
        ) : null}
        {warn && status.lastDate ? (
          <>
            <Note>
              {self
                ? t('vaccines.hadWarning.self', { date: formatDate(status.lastDate, language) })
                : t('vaccines.hadWarning', { name, date: formatDate(status.lastDate, language) })}
            </Note>
            <Actions>
              <Button
                small
                grow
                onClick={() => {
                  dispatch({ type: 'vaccines/keep', vaccineId: vaccine.id });
                  focusSoon(`vaccine-${vaccine.id}`);
                }}
              >
                {t('vax.keep')}
              </Button>
              <Button
                small
                grow
                onClick={() => {
                  select(row, false);
                  focusSoon(`vaccine-${vaccine.id}`);
                }}
              >
                {t('vax.remove')}
              </Button>
            </Actions>
          </>
        ) : null}
      </>
    );
  };

  return (
    <>
      <p className="oc-lead">{self ? t('vaccines.lead.self') : t('vaccines.lead', { name })}</p>
      <VaccineList>
        {rows.map((row) => {
          const { vaccine, status } = row;
          return (
            <VaccineRow
              key={vaccine.id}
              checkboxId={`vaccine-${vaccine.id}`}
              name={t(`vaccine.${vaccine.id}.name`)}
              status={status.status}
              statusLabel={statusLabel(row)}
              selected={row.selection !== null}
              onSelectedChange={(selected) => select(row, selected)}
              expanded={expanded === vaccine.id}
              onExpandedChange={(open) => setExpanded(open ? vaccine.id : null)}
              pick={pickLine(row)}
              reminder={reminder(row)}
            >
              <p className="oc-small">
                {status.lastDate
                  ? t('vaccines.lastDose', { date: formatDate(status.lastDate, language) })
                  : t('vaccines.noDose')}
              </p>
              {withProducts && row.selection ? (
                <ProductPicker
                  row={row}
                  age={age}
                  onChoose={(product) => dispatch({ type: 'vaccines/product', vaccineId: vaccine.id, product })}
                />
              ) : null}
              <div>
                <Disclosure label={t('why.matters')}>
                  <p>{t(`vaccine.${vaccine.id}.why`)}</p>
                </Disclosure>
                <Disclosure label={t('vax.about')}>
                  <p>{t('vaccines.aboutPlaceholder')}</p>
                </Disclosure>
                <Disclosure label={t('vax.goodToKnow')}>
                  <p>{t('vaccines.goodToKnowPlaceholder')}</p>
                </Disclosure>
              </div>
            </VaccineRow>
          );
        })}
      </VaccineList>
      <Choice
        kind="checkbox"
        top
        title={self ? t('vaccines.notSure.self') : t('vaccines.notSure', { name })}
        sub={t('vaccines.notSureSub')}
        checked={draft.vaccines.notSure}
        onChange={(notSure) => dispatch({ type: 'vaccines/notSure', notSure })}
      />
      {clinic ? (
        <p className="oc-small">
          {t('vaccines.source', { registry: clinic.pharmacy.registry, pharmacy: clinic.pharmacy.name })}
        </p>
      ) : null}
      <div aria-live="polite">
        {showError && nothingChosen ? <Note warn>{t('error.vaccines')}</Note> : null}
      </div>
      <SectionActions
        beforeContinue={() => {
          setShowError(true);
          return !nothingChosen;
        }}
      />
    </>
  );
}
