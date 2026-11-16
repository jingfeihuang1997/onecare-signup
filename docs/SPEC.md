# OneCare vaccine sign-up: build spec

Source of truth for building the two sign-up options. Read with `onecare.css` (the design system) and `reference/*.html` (one static page per screen and state).

## 1. Context

- OneCare gives each pharmacy a sign-up page for a vaccination clinic. The pharmacy sends people a link. Most people open it on a phone.
- Goal: as many people as possible finish signing up, and as many as possible also give the optional details.
- Main users: older adults signing up themselves, and helpers (adult children, parents, legal representatives) signing up someone else.
- Two options share one data model, one stylesheet and the same section content. They differ only in the shell around the sections.
  - **Option A, "Calm and clear"**: one page, six sections, a finished section folds into a one-line summary.
  - **Option B, "Clinic pass"**: one step per screen, a pass that collects a stamp for each step.

## 2. Sections and order

| # | Section | A panel | B stamp | Required |
|---|---|---|---|---|
| 0 | Start: language, who is it for, resume | Start screen | Start screen (stamp "Who") | yes |
| 1 | Patient: name, preferred name, date of birth, record lookup | 1 Patient | Who | yes |
| 2 | Vaccines | 2 Vaccines | Shots | yes (at least one, or "not sure") |
| 3 | Insurance and Medicare | 3 Insurance and Medicare | Card | see 5.3 |
| 4 | Your details (helper only) | 4 Your details | Who (sub-step "And who are you?") | when signing up someone else |
| 5 | Save time at the clinic: health questions, more about the patient, home address, reminders | 5, tagged Optional | Extras (mark "+") | no, with a "Skip for now" button of equal weight |
| 6 | Review and sign | 6 Review and sign | Sign | yes |
| 7 | Done | Done screen | Pass screen | n/a |

When the person picks "Myself", section 4 does not exist: A has five panels, B skips the "And who are you?" screen.

## 3. Screens and states (reference files)

| Reference file | What it shows |
|---|---|
| A01-Start, B01-Start | First visit: language, clinic, who is it for |
| A02-Start-Returning, B02-Start-Returning | Device memory: "Welcome back", continue a draft, forget this device |
| A03-Patient-New, B03-Patient-New | No record found: empty fields, gentle note |
| A04-Patient-Found, B04-Patient-Found | Record found: review rows, partly masked, tap a row to change |
| A05-Vaccines, B05-Vaccines | Full list, one vaccine expanded, one selected and folded, one "had it" warning |
| A06-Insurance, B06-Card | Photo buttons, Medicare number, last 4 of SSN |
| A07-Camera, B07-Camera | In-page camera view |
| A08-Your-Details, B08-About-You | Helper fields |
| A09-Extras, B09-Extras | Optional section with one sub-panel open (address type-ahead) |
| A10-Health, B10-Health | The 14 health questions |
| A11-Sign, B11-Sign | Review, who signs, typed signature, consents |
| A12-Done, B12-Pass | Confirmation, still-open extras, device memory notice |
| A13-Jump | Section list in a bottom sheet (A only) |
| A-Desktop, B-Desktop | Two-column layout at 1280px |

The reference pages are fixed at 390px wide so they match the design canvas. The real build is fluid: see section 7.

## 4. Interaction rules

1. **Panels open to edit.** A folded panel shows its summary, so it doubles as the review. The whole panel head is one button with `aria-expanded`. There is no separate Edit button. In A, one main panel is open at a time.
2. **Every "Why we ask" and "Why it matters" starts folded.** They are disclosure rows. Copy comes from the field reasons table; until it is approved, show the draft text marked as a placeholder.
3. **Review rows** show the value without opening anything. Tapping a row opens that field for editing.
4. **Progress.** A: sticky bar with six segments, the label "Section n of 6", and a "Sections" button that opens the bottom sheet. B: five stamps (Who, Shots, Card, Extras, Sign); done stamps are filled and tilted.
5. **Text size.** A− and A+ step the root font size through 100%, 112%, 125%, 140% and remember the choice. Never disable pinch zoom.
6. **Language.** English, Español, 中文 (Simplified). Chosen on Start, changeable from the header, remembered, and set on `<html lang>`.

## 5. Section logic

### 5.1 Start
- "Myself" or "Someone else". A patient under 18 cannot be "Myself".
- If device memory holds a draft, show "Welcome back" first, then the normal question underneath.

### 5.2 Patient and record lookup
- Fields: first name, last name, preferred name (optional), date of birth as three numeric inputs (MM, DD, YYYY).
- After name and date of birth, call the lookup.
  - **Found:** show review rows with stored values partly masked, exactly as the current site masks them. "Yes, this is right" continues. "This is not Maria" clears and returns to empty fields.
  - **Not found:** show the note "We don't have [name] on file yet. That's fine, we'll add [her/him/them]." and continue.
- Date of birth drives age rules: under 18 requires a helper; 65 and over shows Medicare number and last 4 of SSN.

### 5.3 Vaccines
- Catalog (all 16 must exist in data): Influenza, COVID-19, Tdap, Shingles (Zoster), Pneumococcal, RSV, Hepatitis B, MMR, Varicella, HPV, Meningococcal ACWY, DTaP, Hib, Rotavirus, Polio (IPV), Hepatitis A.
- Shown list = offered at this clinic and allowed for the patient's age. Vaccines not allowed for the age are named in one muted line under the list. Age rules are config, not hard-coded: [rules to be supplied by OneCare].
- Each row: checkbox, name, status chip. Status: `due` ("Due now"), `had` ("Had it · Mon YYYY"), `none` ("No record"). Sort due, then had, then none.
- Tapping a row selects it and expands it. Only one row is expanded at a time; a selected row that is folded shows its chosen product in one line.
- Expanded content, in order: last dose on record; product choice; then three folded rows: "Why it matters", "About this vaccine", "Good to know before the shot".
- Product choice: the product the patient had before is preselected and shown first. "Other options (n)" is folded and always ends with "No preference" and "I'd like to ask the pharmacist". Whether product choice shows at all is a clinic setting that defaults from the pharmacy.
- Selecting a `had` vaccine shows a warning with the date and two buttons, "Keep it" and "Remove". It never blocks.
- "I'm not sure what [name] needs" is always available.

### 5.4 Insurance and Medicare
- First choice is the camera. Tapping "Take a photo" calls `getUserMedia` straight away, so the browser asks for camera permission at that moment, and opens the in-page camera view with a card frame.
- If the camera is unsupported or permission is denied, fall back to `<input type="file" accept="image/*" capture="environment">`. "Upload photos I already have" uses a file input without `capture`.
- Front and back are separate photos. After each, run OCR, fill the fields, and ask the person to check them. Keep the images for the pharmacy.
- Manual fields ("Type it in instead"): insurance company, plan name, BIN, PCN, member ID, group ID.
- Age 65 and over also shows Medicare number and last 4 of SSN.
- Desktop: two drop zones plus "Use your phone's camera" with a QR code (stub the QR hand-off).
- Open question for OneCare: which of these are required to submit. Treat them as required until told otherwise, behind one config flag.

### 5.5 Your details (helper)
- First name, last name, relationship (select), mobile number, email. Neutral wording: the helper is not always a parent.
- On "Sign up another person", keep these values.

### 5.6 Save time at the clinic (optional, before signing)
- Four sub-panels: Health questions; More about [name] (sex, race); Home address; Reminders (phone, email).
- Health questions: 14 questions with the exact wording in `reference/A10-Health.html`. Three answers: Yes, No, Not sure. All start as No (kept from the current site at OneCare's direction).
- Home address: type-ahead suggestions limited to US addresses; "Type the address by hand" reveals street, unit, city, state, ZIP. If the record has an address, prefill it.
- "Continue to sign" and "Skip for now" have equal visual weight. Anything skipped appears under "Still open" on the Done screen.

### 5.7 Review and sign
- A: the folded panels above are the review. B: a review list at the top of the screen.
- "Who is signing?": the patient, or the helper. Signer's full name is prefilled and editable.
- Signature has two modes. **Type** is the default: the typed name is rendered in a script font as the signature. **Draw** is a canvas.
- A checkbox "I agree that this typed name is my electronic signature" is required in Type mode.
- Two consents, both required: Pharmacy consent (with a "Read the vaccine information" link) and OneCare consent.
- Store with the signature: signer name, signer role, method (typed or drawn), ISO timestamp, consent text version, user agent.
- Consent wording and the legal standing of typed signatures are [pending OneCare legal review].

### 5.8 Done
- Confirmation, clinic details, vaccines requested.
- "Add to calendar" (generate an .ics file). "Sign up another person" returns to Start with helper details kept.
- "Still open": any skipped optional items, one row each.
- Device memory notice with "Forget what is saved on this phone".

## 6. Device memory

- One `localStorage` key, `onecare.signup.v1`, JSON. Wrap every read and write in try/catch; the app must work without it.
- **May store:** language, text size, helper details, and per patient: first name, last name, preferred name, date of birth, vaccine selections, current section, home address, reminder phone and email.
- **Never store:** last 4 of SSN, Medicare number, any insurance ID, card images, health answers, sex, race, signature.
- Expire entries after 30 days. "Forget what is saved on this phone" deletes the key.
- This feature is [pending OneCare privacy sign-off]; keep it behind a config flag.

## 7. Layout and design system

- Use `onecare.css` as the starting point. Root element: `class="oc oc--a"` or `class="oc oc--b"`.
- Convert font sizes to `rem` (16px = 1rem) so text-size controls and browser settings work. Sizes must look identical at 100%.
- Phone first. Content column max-width 560px, centered. From 900px wide, use `.oc-layout`: side column (clinic card and section list in A; the pass in B) plus content.
- Add what the static CSS lacks: a visible focus ring on every interactive element, hover and pressed states, disabled state, a field error state that does not rely on color alone (an icon and a text message under the field), and `prefers-reduced-motion`.
- Touch targets at least 44px. Text contrast at least 4.5:1.
- The OneCare logo is a placeholder (`.oc-logo`). Replace it with the real image when supplied.

## 8. Data and services (mock first)

Types: `Clinic`, `Pharmacy`, `Patient`, `Helper`, `Vaccine`, `VaccineStatus`, `VaccineSelection`, `Insurance`, `Extras`, `Signature`, `SignupDraft`.

Mock services, each returning a Promise with a short delay:
- `getClinic(token)`: pharmacy name, date and time, address, offered vaccines, product-choice flag.
- `lookupPatient(firstName, lastName, dob)`: `{ found, maskedRecord }`.
- `getVaccineStatus(patientId)`: status and last date per vaccine, last product.
- `readCard(image, side)`: fields with a confidence value.
- `searchAddress(query)`: up to five US suggestions.
- `submitSignup(draft)`: confirmation id.

Seed data must reproduce the reference scenario: Ana Lopez signing up her mother Maria Lopez, born Apr 12, 1954, at Cedar Lane Pharmacy, Tue, Dec 1, 2026 at 10:00 AM. A second seed patient has no record.

## 9. Placeholders and open questions

- `[Clinic address]`, `[pharmacy phone]`, OneCare logo image.
- All vaccine "Why it matters", "About this vaccine" and "Good to know" copy.
- Whether a clinic can offer more than one time slot. The current site shows a single fixed time. If yes, add a time picker on Start; do not build it yet.
- Which insurance fields are required; what happens with no insurance.
- Age rules per vaccine; rules for people 65 and over without Medicare.
- Spanish and Chinese wording of the health questions and consents needs professional translation.

## 10. Decisions (Nov 14, 2026)

Made by the product owner after the Prompt 0 review. Where this section differs from sections 1 to 9 or from a reference page, this section wins. Anything mocked or unverified is tracked in `TO-BE-VERIFIED.md`.

### 10.1 From the product owner

1. **Same flow in A and B.** The steps, their order and their logic are identical. Only the style and the shell differ.
2. **Order.** Start, Patient, Your details (helper only), Vaccines, Insurance and Medicare, Save time at the clinic, Review and sign, Done. The helper step comes straight after Patient. In B it belongs to the "Who" stamp. A panels: 1 Patient, 2 Your details, 3 Vaccines, 4 Insurance and Medicare, 5 Save time at the clinic, 6 Review and sign. This replaces the order in section 2 and in A08 and B08.
3. **"Why we ask" placement.** One row directly under the section title, then a divider, then the section body. It still starts folded. This replaces its position lower in the body in the references.
4. **Density.** No empty space and no fixed heights. A section should fit one phone screen where its content allows; the vaccine list and the health questions are the exceptions. Padding, gaps, control heights and font sizes come from the variables at the top of `src/styles/onecare.css`. This replaces "Sizes must look identical at 100%" in section 7.
5. **Health questions** open as their own view: inside panel 5 in A, as their own step in B.
6. **Vaccine rows.** The checkbox selects. Every row has the same chevron button, which shows or hides the details; one row is expanded at a time. The one-line product pick and the "had it" reminder are the row's current state and show without expanding.
7. **Pronouns.** Use the patient's name or "they". Use "you" when the person signs up for themselves.
8. **Relationship.** The list of options plus a free-text entry, so the helper can describe a relationship that is not listed.
9. **Consents** start unticked. If the person presses the submit button with a consent unticked, show a notice saying that pressing it again ticks the consents and submits. [Pending OneCare legal review.]
10. **Insurance.** Medicare is the only insurer whose saved details can be looked up today; the prototype shows that as interface only. For any other insurance, offer a photo or upload that fills the fields, or manual entry. Offer a "no insurance" choice; it completes the section.
11. **Field reasons.** The source is `Field_Reason.xlsx`, column "Reason (To be checked)". The patient-facing wording is an official-style rewrite kept in the dictionaries under `reason.*`. None is verified yet.

12. **All vaccines are shown.** Every vaccine the clinic offers appears in the list, whatever the patient's age: all 16 in the reference scenario. Nothing is hidden by age and there is no "Not offered at [name]'s age" line. This replaces the age filter in section 5.3. The age rules stay in config and only mark a row as outside the usual age.

Added Nov 16, 2026, after the review of the first build:

13. **Date of birth.** The month is a list of month names; day and year stay numeric inputs. This replaces the three numeric inputs in section 5.2.
14. **Patient section.** Names start with a capital letter automatically. Sex (optional) is asked here, not in the optional section. A confirmation email is required here, with "Whose email is this?" so it can be the patient's, a parent's or guardian's, or someone else's. The helper step no longer asks for an email. Notices in this section (under 18, record found, no record) use the yellow notice style.
15. **Insurance flow.** First "Do you have health insurance?" (it includes Medicare and Medicaid): Yes, No, or I'm not sure. Yes: add photos of the front and back of the card (upload or take a photo), or "Enter details manually". Manual: choose Medicare or Other insurance, with "Upload a card instead" to go back. Medicare: Medicare number (MBI) and last 4 of the SSN. Other insurance: company or plan name, member ID, group ID (optional) and last 4 of the SSN. No and "I'm not sure" complete the section. Medicare is offered at any age. Plan name, BIN and PCN are no longer asked. No QR hand-off. This replaces section 5.4 and item 10 above.
16. **Save time at the clinic.** Everything is on view, nothing folded: the health questions in a highlighted block, then home address, phone number (optional), reminders and race. The health questions show "Not started" until they are opened and saved; opened, all answers start at No. Reminders are opt-in: by email, by text message, or both. Each offers what was given earlier (the confirmation email; the phone number) or a different one, with a line explaining that the confirmation is emailed either way. This replaces the four sub-panels in section 5.6.
17. **Consent and signature.** Section 6 is named "Consent and signature". When only one person can sign (someone signing up themselves, or a helper signing for a patient under 18), "Who is signing?" is left out, and the signer's name and the typed signature are filled in from the name given earlier. The name can still be changed.
18. **"Why we ask"** is in regular weight and smaller than the body text.
19. **Wide screens.** An opened section scrolls up to the same height as the side column, so their top edges line up.

Added Nov 16, 2026, after the second review. Where these differ from items 14 and 15, these win:

20. **Stamps lead to their step (B).** Each stamp at the top of option B, and in the pass on a wide screen, is a button that opens its step, finished or not. A step that is not finished stays marked as not done. "Who" opens the first of its steps that is not finished.
21. **Insurance, corrected.** Medicare is offered from age 65 only: under 65 the insurance type is not asked. "Other insurance" typed in asks for insurance company, plan name, BIN, PCN, member ID, group ID (optional) and the last 4 of the SSN.
22. **Reminder colour.** Every reminder and notice uses one colour per theme: yellow in A, light blue in B. A warning that needs attention keeps its border.
23. **Products.** Every vaccine lists its products, and every product has one line of details under its name. The lists and the lines are a draft by Claude from general knowledge, to be checked (see `TO-BE-VERIFIED.md`).
24. **Sex is required**, with "Prefer not to say" among the choices. It is still never stored on the device, so after a refresh the Patient section asks for it again.
25. **Whose email.** The choices are: mine, a family member's, my guardian's, someone else's (for a helper: mine, the patient's, a family member's, someone else's).
26. **Logo.** The header shows the OneCare mark as an SVG drawn from the product owner's picture, in place of the "LOGO" placeholder.

Added Nov 16, 2026, after the third review. These replace items 17, 25 and 26 where they differ:

27. **Logo.** Four tiles on a transparent background, in the text colour. It is also the browser tab icon (`public/favicon.svg`).
28. **Top spacing on wide screens.** The space between the top bar and the content is the same when a page opens as after scrolling, so the side column and the section headings never shift. This holds in A and in B, on every step.
29. **Whose email.** "Mine", then (for a helper) the patient, then the same list as "Your relationship to [name]": daughter or son, spouse or partner, parent, legal guardian or representative, other. No second set of words for the same people.
30. **Sex choices.** Female, Male, Non-binary (X), Prefer not to say.
31. **Who is signing.** Left out only for someone signing up themselves. A helper always sees it, also when the patient is under 18 and the helper is the only choice.

32. **Logo, corrected.** Four tiles with rounded corners; the top right one is tilted slightly, as in the picture the product owner supplied.
33. **"Device", not "phone".** What is remembered is "saved on this device".
34. **No focus ring on arrival.** A page that has just loaded or been refreshed does not move focus to the open section, so no outline appears around its heading. After the first key press or tap, opening a section moves focus as before.
35. **One spacing scale.** Every gap and padding uses 4, 8, 12, 16 or 24px from the variables, and every box (card, panel, pass, drop zone) has the same 12px inset.

### 10.2 Defaults the product owner left to the builder

- Vaccine rows sort due, had, none, then by a fixed display order taken from A05.
- "Still open" on Done lists one row per unfinished optional sub-panel.
- The relationship shows in summaries exactly as chosen or typed.
- "Continue to sign" is filled and "Skip for now" is outlined, at the same size.
- In B the Sign step says "Tap any line below to change it."
- Layout switches at 900px with a media query; the 560px content cap applies below that.
- The Extras stamp is filled on "Continue to sign" and on "Skip for now".
- A found record prefills the home address only.
- "Add a second card" is a stub until OneCare confirms it.
- Age is counted on the clinic date.
- Never-store fields live in memory only, so a refresh clears them.
- Language and text size are remembered even when the device-memory flag is off.
- Health answers the person never opened are submitted as "not answered", not as "No".
- "Myself" shows five sections and "Section n of 5".
- Any section can be opened at any time; submitting is blocked until the required ones are done.
- The header language button opens a menu with the three languages.
- Fonts are self-hosted.
- The desktop insurance layout (drop zones and QR code) switches on width alone.
