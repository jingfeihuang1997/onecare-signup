import { useState, type ReactNode } from 'react';
import {
  Actions,
  AddressSuggest,
  BottomSheet,
  Button,
  Card,
  Chip,
  Choice,
  DateOfBirthField,
  Disclosure,
  Field,
  Header,
  Note,
  Panel,
  Pass,
  PassPart,
  ProgressBar,
  Question,
  ReasonList,
  ReviewList,
  SectionNav,
  Segmented,
  SelectField,
  SignatureBox,
  Stamps,
  SubPanel,
  VaccineList,
  VaccineRow,
  type AddressOption,
  type Answer,
  type DateOfBirthValue,
  type SectionNavItem,
  type StampItem,
} from '../components';
import { useI18n, type Language } from '../i18n';

// Demo content for the gallery. It mirrors the reference scenario in SPEC section 8.
// This page is a development tool, so its sample text is not in the dictionaries.

const ADDRESSES: readonly AddressOption[] = [
  { id: 'a1', main: '1420 Maple St', sub: 'Ann Arbor, MI 48104' },
  { id: 'a2', main: '1420 Maple Rd', sub: 'Troy, MI 48084' },
  { id: 'a3', main: '1420 Maple Ave', sub: 'Kalamazoo, MI 49008' },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="oc-kit__group">
      <h2 className="oc-kit__title">{title}</h2>
      {children}
    </section>
  );
}

export function KitGallery({ themeName }: { themeName: string }) {
  const { t, language, setLanguage } = useI18n();

  const [openPanel, setOpenPanel] = useState<number | null>(3);
  const [openSub, setOpenSub] = useState<string | null>('address');
  const [signer, setSigner] = useState('helper');
  const [agree, setAgree] = useState(false);
  const [dob, setDob] = useState<DateOfBirthValue>({ month: '04', day: '12', year: '1954' });
  const [badDob, setBadDob] = useState<DateOfBirthValue>({ month: '13', day: '40', year: '2090' });
  const [firstName, setFirstName] = useState('Maria');
  const [selected, setSelected] = useState<Record<string, boolean>>({
    flu: true,
    covid: true,
    rsv: true,
    tdap: false,
  });
  const [expanded, setExpanded] = useState<string | null>('flu');
  const [product, setProduct] = useState('fluzone');
  const [answer, setAnswer] = useState<Answer>('no');
  const [signMode, setSignMode] = useState<'type' | 'draw'>('type');
  const [address, setAddress] = useState('1420 Map');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signature, setSignature] = useState('Ana Lopez');

  const stamps = (current: number): StampItem[] =>
    (
      [
        ['who', t('stamp.who'), '1'],
        ['shots', t('stamp.shots'), '2'],
        ['card', t('stamp.card'), '3'],
        ['extras', t('stamp.extras'), '+'],
        ['sign', t('stamp.sign'), '4'],
      ] as const
    ).map(([id, label, mark], index) => ({
      id,
      label,
      mark,
      state: index < current ? 'done' : index === current ? 'current' : 'todo',
    }));

  const sections: SectionNavItem[] = [
    { id: 's1', number: 1, label: 'Patient', state: 'done', stateLabel: t('nav.state.done') },
    { id: 's2', number: 2, label: 'Your details', state: 'done', stateLabel: t('nav.state.done') },
    { id: 's3', number: 3, label: 'Vaccines', state: 'current', stateLabel: t('nav.state.current') },
    { id: 's4', number: 4, label: 'Insurance and Medicare', state: 'todo', stateLabel: t('nav.state.todo') },
    { id: 's5', number: 5, label: 'Save time at the clinic', state: 'todo', stateLabel: t('nav.state.optional') },
    { id: 's6', number: 6, label: 'Consent and signature', state: 'todo', stateLabel: t('nav.state.todo') },
  ];

  const patientReasons = (
    <ReasonList
      draft
      items={[
        { field: 'Name', reason: t('reason.patient.name') },
        { field: 'Preferred name', reason: t('reason.patient.preferredName') },
        { field: t('dob.legend'), reason: t('reason.patient.dob') },
      ]}
    />
  );

  const togglePanel = (n: number) => setOpenPanel((current) => (current === n ? null : n));
  const toggleSub = (id: string) => setOpenSub((current) => (current === id ? null : id));
  const toggleExpanded = (id: string) => (open: boolean) => setExpanded(open ? id : null);
  const toggleSelected = (id: string) => (value: boolean) =>
    setSelected((current) => ({ ...current, [id]: value }));

  const matches = ADDRESSES.filter(
    (item) => address.length >= 3 && item.main.toLowerCase().startsWith(address.toLowerCase()),
  );

  return (
    <>
      <Header pharmacyName="Cedar Lane Pharmacy" />

      <Group title={themeName}>
        <h1 className="oc-h1">Component kit</h1>
        <p className="oc-lead">Every component in every state. Lead text looks like this.</p>
        <p className="oc-small">
          Small text looks like this. <a className="oc-link" href="#link">A link</a>
        </p>
      </Group>

      <Group title="ProgressBar">
        <ProgressBar current={3} total={6} name="Vaccines" onOpenSections={() => setSheetOpen(true)} />
      </Group>

      <Group title="Stamps">
        <Stamps items={stamps(0)} />
        <Stamps items={stamps(2)} />
        <Stamps items={stamps(5)} />
      </Group>

      <Group title="Pass">
        <Pass>
          <PassPart label={t('pass.label')} title="Maria Lopez">
            <strong>Tue, Dec 1, 2026 at 10:00 AM</strong>
            <span>Cedar Lane Pharmacy · [Clinic address]</span>
          </PassPart>
          <PassPart>
            <Stamps flat items={stamps(2)} />
          </PassPart>
          <PassPart>
            <span className="oc-card__kicker">Shots on the pass</span>
            <span>Flu · COVID-19 · RSV</span>
          </PassPart>
        </Pass>
      </Group>

      <Group title="Card">
        <Card kicker="Vaccination clinic" title="Tue, Dec 1, 2026 at 10:00 AM">
          <span>Cedar Lane Pharmacy · [Clinic address]</span>
        </Card>
        <Card gap>
          <h2 className="oc-h2">Welcome back</h2>
          <Choice
            kind="nav"
            big
            title="Continue Maria's sign-up"
            sub="You stopped at Insurance and Medicare"
            onClick={() => undefined}
          />
          <p className="oc-small">Saved on this device from last time.</p>
          <Button variant="link">Forget what is saved on this device</Button>
        </Card>
      </Group>

      <Group title="Button">
        <Button variant="primary">{t('common.continue')}</Button>
        <Button>{t('common.back')}</Button>
        <Button variant="primary" icon="camera">
          Take a photo of the front
        </Button>
        <Button icon="calendar">Add to calendar</Button>
        <Button variant="link">Type it in instead</Button>
        <Actions>
          <Button small grow>
            {t('vax.keep')}
          </Button>
          <Button small grow>
            {t('vax.remove')}
          </Button>
        </Actions>
        <Actions>
          <Button>{t('common.back')}</Button>
          <Button variant="primary" grow>
            {t('common.continue')}
          </Button>
        </Actions>
        <Actions>
          <Button disabled>{t('common.back')}</Button>
          <Button variant="primary" grow disabled>
            Disabled
          </Button>
        </Actions>
      </Group>

      <Group title="Choice">
        <Choice
          kind="nav"
          big
          title="Myself"
          sub="I am the one getting the vaccine"
          onClick={() => undefined}
        />
        <fieldset className="oc-fieldset">
          <legend className="oc-label">Who is signing?</legend>
          <Choice
            kind="radio"
            name={`signer-${themeName}`}
            title="Maria Lopez"
            sub="The patient"
            checked={signer === 'patient'}
            onChange={() => setSigner('patient')}
          />
          <Choice
            kind="radio"
            name={`signer-${themeName}`}
            title="Ana Lopez"
            sub="Signing for Maria"
            checked={signer === 'helper'}
            onChange={() => setSigner('helper')}
          />
        </fieldset>
        <Choice kind="checkbox" top title="Pharmacy consent" checked={agree} onChange={setAgree}>
          I consent to Maria being vaccinated by Cedar Lane Pharmacy.{' '}
          <a className="oc-link" href="#vaccine-info">
            Read the vaccine information
          </a>
        </Choice>
        <Choice kind="checkbox" title="Disabled" checked={false} disabled onChange={() => undefined} />
      </Group>

      <Group title="Chip">
        <div className="oc-kit__row">
          <Chip tone="due">{t('vax.status.due')}</Chip>
          <Chip tone="had">{t('vax.status.had', { date: 'Sep 2024' })}</Chip>
          <Chip>{t('vax.status.none')}</Chip>
        </div>
      </Group>

      <Group title="Note">
        <Note>We don't have Maria on file yet. That's fine, we'll add them.</Note>
        <Note warn>
          Our records show Maria had an RSV vaccine on <strong>Sep 20, 2024</strong>.
        </Note>
      </Group>

      <Group title="Field">
        <Field
          label="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <Field label="Preferred name" optional placeholder="What should we call them?" autoComplete="off" />
        <Field label="Medicare number" hint="The photo can fill this in." placeholder="1EG4-TE5-MK73" />
        <Field label="Last 4 digits of Social Security number" short inputMode="numeric" />
        <Field
          label="Your email"
          type="email"
          defaultValue="ana.lopez@"
          error="Enter the full email address, like name@example.com."
        />
        <Field label="Disabled" defaultValue="Cannot change" disabled />
        <SelectField label="Your relationship to Maria" defaultValue="child">
          <option value="child">Daughter or son</option>
          <option value="spouse">Spouse or partner</option>
          <option value="parent">Parent</option>
          <option value="guardian">Legal guardian or representative</option>
          <option value="other">Other</option>
        </SelectField>
        <div className="oc-grid">
          <Field label="Your first name" defaultValue="Ana" />
          <Field label="Your last name" defaultValue="Lopez" />
        </div>
      </Group>

      <Group title="DateOfBirthField">
        <DateOfBirthField value={dob} onChange={setDob} />
        <DateOfBirthField value={badDob} onChange={setBadDob} error="Enter a real date, like 04 12 1954." />
      </Group>

      <Group title="Disclosure">
        <Disclosure label={t('why.matters')}>
          <p>{t('vaccine.flu.why')}</p>
        </Disclosure>
        <Disclosure label={t('vax.about')}>
          <p>[About this vaccine: copy to be supplied]</p>
        </Disclosure>
        <Disclosure plain label="Other options (5)">
          <p>Plain variant: no line above the row.</p>
        </Disclosure>
      </Group>

      <Group title="Panel">
        <Panel
          number={1}
          title="Patient"
          summary="Maria Lopez · Apr 12, 1954"
          done
          open={openPanel === 1}
          onToggle={() => togglePanel(1)}
          why={patientReasons}
        >
          <p className="oc-lead">A finished panel, opened again for editing.</p>
        </Panel>
        <Panel
          number={2}
          title="Your details"
          summary="Ana Lopez · Daughter or son · (313) 555-0142"
          done
          open={openPanel === 2}
          onToggle={() => togglePanel(2)}
        >
          <p className="oc-lead">A panel with no "Why we ask" row: only the divider.</p>
        </Panel>
        <Panel
          number={3}
          title="Patient (open)"
          open={openPanel === 3}
          onToggle={() => togglePanel(3)}
          why={patientReasons}
        >
          <p className="oc-lead">Enter the details as they appear on the insurance or Medicare card.</p>
          <Field label="First name" defaultValue="Maria" />
          <Field label="Last name" defaultValue="Lopez" />
          <Actions>
            <Button variant="primary" grow>
              {t('common.continue')}
            </Button>
          </Actions>
        </Panel>
        <Panel
          number={5}
          title="Save time at the clinic"
          tag={t('common.optional')}
          summary="Health questions, address, reminders"
          open={openPanel === 5}
          onToggle={() => togglePanel(5)}
        >
          <p className="oc-lead">Optional. Anything you add now is one less form at the clinic.</p>
        </Panel>
        <Panel
          number={6}
          title="Consent and signature"
          summary="Check, then sign to finish"
          open={openPanel === 6}
          onToggle={() => togglePanel(6)}
        >
          <p className="oc-lead">Tap any line above to change it.</p>
        </Panel>
      </Group>

      <Group title="SubPanel">
        <SubPanel
          drill
          title="Health questions"
          summary="14 answers, all set to No"
          onToggle={() => undefined}
        />
        <SubPanel
          title="More about Maria"
          summary="Sex · Race"
          open={openSub === 'more'}
          onToggle={() => toggleSub('more')}
        >
          <p className="oc-lead">Sub-panel body.</p>
        </SubPanel>
        <SubPanel
          title="Maria's home address"
          summary="Add an address"
          open={openSub === 'address'}
          onToggle={() => toggleSub('address')}
          why={<p>{t('reason.extras.address')}</p>}
        >
          <AddressSuggest
            label="Start typing the address"
            value={address}
            onChange={setAddress}
            suggestions={matches}
            onSelect={(item) => setAddress(item.main)}
          />
          <Button variant="link">Type the address by hand</Button>
        </SubPanel>
      </Group>

      <Group title="VaccineRow">
        <VaccineList>
          <VaccineRow
            name="Influenza (flu)"
            status="due"
            statusLabel={t('vax.status.due')}
            selected={Boolean(selected.flu)}
            onSelectedChange={toggleSelected('flu')}
            expanded={expanded === 'flu'}
            onExpandedChange={toggleExpanded('flu')}
            pick="Fluzone High-Dose · same as last time"
          >
            <p className="oc-small">Last flu shot on record: Oct 14, 2025</p>
            <fieldset className="oc-fieldset">
              <legend className="oc-label">Which flu vaccine?</legend>
              <Choice
                kind="radio"
                name={`flu-${themeName}`}
                title="Fluzone High-Dose"
                sub="Same as last time · Suggested for age 65+"
                checked={product === 'fluzone'}
                onChange={() => setProduct('fluzone')}
              />
              <Disclosure plain label="Other options (5)">
                <p>[Other products, ending with "No preference" and "I'd like to ask the pharmacist"]</p>
              </Disclosure>
            </fieldset>
            <div>
              <Disclosure label={t('why.matters')}>
                <p>{t('vaccine.flu.why')}</p>
              </Disclosure>
              <Disclosure label={t('vax.about')}>
                <p>[About this vaccine: copy to be supplied]</p>
              </Disclosure>
              <Disclosure label={t('vax.goodToKnow')}>
                <p>[Good to know: copy to be supplied]</p>
              </Disclosure>
            </div>
          </VaccineRow>
          <VaccineRow
            name="COVID-19"
            status="due"
            statusLabel={t('vax.status.due')}
            selected={Boolean(selected.covid)}
            onSelectedChange={toggleSelected('covid')}
            expanded={expanded === 'covid'}
            onExpandedChange={toggleExpanded('covid')}
            pick="Spikevax (Moderna) · same brand as last time"
          >
            <p className="oc-small">Last COVID-19 shot on record: Oct 14, 2025</p>
          </VaccineRow>
          <VaccineRow
            name="RSV"
            status="had"
            statusLabel={t('vax.status.had', { date: 'Sep 2024' })}
            selected={Boolean(selected.rsv)}
            onSelectedChange={toggleSelected('rsv')}
            expanded={expanded === 'rsv'}
            onExpandedChange={toggleExpanded('rsv')}
            reminder={
              <>
                <Note warn>
                  Our records show Maria had an RSV vaccine on <strong>Sep 20, 2024</strong>, so they
                  may not need another one. You can keep it and the pharmacist will confirm.
                </Note>
                <Actions>
                  <Button small grow>
                    {t('vax.keep')}
                  </Button>
                  <Button small grow onClick={() => toggleSelected('rsv')(false)}>
                    {t('vax.remove')}
                  </Button>
                </Actions>
              </>
            }
          >
            <p className="oc-small">Last RSV shot on record: Sep 20, 2024</p>
          </VaccineRow>
          <VaccineRow
            name="Tdap"
            status="had"
            statusLabel={t('vax.status.had', { date: 'Jun 2019' })}
            selected={Boolean(selected.tdap)}
            onSelectedChange={toggleSelected('tdap')}
            expanded={expanded === 'tdap'}
            onExpandedChange={toggleExpanded('tdap')}
          >
            <p className="oc-small">Last Tdap shot on record: Jun 3, 2019</p>
          </VaccineRow>
          <VaccineRow
            name="Meningococcal ACWY"
            status="none"
            statusLabel={t('vax.status.none')}
            selected={Boolean(selected.men)}
            onSelectedChange={toggleSelected('men')}
            expanded={expanded === 'men'}
            onExpandedChange={toggleExpanded('men')}
          >
            <p className="oc-small">No dose on record.</p>
          </VaccineRow>
        </VaccineList>
      </Group>

      <Group title="ReviewList">
        <ReviewList
          rows={[
            { id: 'name', label: 'Name', value: 'Maria Lopez', onClick: () => undefined },
            { id: 'dob', label: t('dob.legend'), value: 'Apr 12, 1954', onClick: () => undefined },
            { id: 'phone', label: 'Phone', value: '(•••) •••-0142', onClick: () => undefined },
          ]}
        />
      </Group>

      <Group title="Segmented">
        <Segmented<Language>
          label={t('header.languageMenu')}
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'en', label: t('language.en'), lang: 'en' },
            { value: 'es', label: t('language.es'), lang: 'es' },
            { value: 'zh-Hans', label: t('language.zh-Hans'), lang: 'zh-Hans' },
          ]}
        />
        <Segmented<'type' | 'draw'>
          label="How to sign"
          value={signMode}
          onChange={setSignMode}
          options={[
            { value: 'type', label: 'Type' },
            { value: 'draw', label: 'Draw' },
          ]}
        />
      </Group>

      <Group title="Question">
        <Question number={1} text="Are you sick today?" value={answer} onChange={setAnswer} />
      </Group>

      <Group title="AddressSuggest">
        <AddressSuggest
          label="Start typing the address"
          value={address}
          onChange={setAddress}
          suggestions={matches}
          onSelect={(item) => setAddress(item.main)}
        />
      </Group>

      <Group title="SignatureBox">
        <Field
          label="Signer's full name"
          autoComplete="name"
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
        />
        <SignatureBox name={signature} />
        <SignatureBox name="" />
      </Group>

      <Group title="SectionNav">
        <Card>
          <SectionNav
            items={sections.map((item) => ({ ...item, stateLabel: undefined }))}
            onSelect={() => undefined}
          />
        </Card>
      </Group>

      <Group title="BottomSheet">
        <Button onClick={() => setSheetOpen(true)}>Open the bottom sheet</Button>
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('sheet.jumpTitle')}>
          <SectionNav items={sections} onSelect={() => setSheetOpen(false)} />
        </BottomSheet>
      </Group>
    </>
  );
}
