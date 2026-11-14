# Claude Code prompts: OneCare vaccine sign-up, options A and B

## Before the first prompt

1. Put the kit in the repository:
   - `CLAUDE.md` in the repository root
   - `SPEC.md`, `onecare.css` and the `reference/` folder in `docs/`
2. Start Claude Code in the repository root.
3. Paste the prompts in order, one at a time. Review and commit after each one.
4. Each prompt ends with a "Done when" list. If Claude Code reports a step as finished without showing those checks, ask it to run them.

The prompts assume a new prototype with mock data. Prompt 12 is for moving the result into the existing OneCare app.

---

## Prompt 0: read and plan (no code)

```text
Read CLAUDE.md, docs/SPEC.md, docs/onecare.css and every file in docs/reference/. Open at least A05-Vaccines.html, A11-Sign.html, B05-Vaccines.html and A-Desktop.html in full.

Do not write code yet. Reply with:
1. What you understand the two options to be and what they share, in five sentences or fewer.
2. The folder structure you propose, with one line per folder.
3. The list of shared section components and the two shells, each with the reference files it must match.
4. Anything in the spec that is ambiguous or that conflicts with a reference page.
5. Whether this repository already has an app and stack you will follow.

Wait for my reply before starting.
```

## Prompt 1: scaffold and design system

```text
Set up the project as CLAUDE.md describes.

Design system:
- Copy docs/onecare.css to src/styles/onecare.css. Convert every font-size from px to rem (16px = 1rem) without changing how anything looks at 100%.
- Add what SPEC section 7 lists as missing: focus ring, hover and pressed states, disabled state, field error state, prefers-reduced-motion. Use the existing variables.
- Build one React component per pattern in the stylesheet: Header, ProgressBar, Stamps, Panel, SubPanel, Field, DateOfBirthField, Button, Choice, Chip, Disclosure, VaccineRow, Note, ReviewList, Segmented, Question, AddressSuggest, SignatureBox, Pass, Card, BottomSheet, SectionNav. Each renders the same markup and class names as the references.
- Text-size control: A− and A+ step the root font size through 100%, 112%, 125%, 140%.
- Add a route /kit that shows every component in every state, once under class "oc oc--a" and once under "oc oc--b".

Done when:
- npm run dev serves /kit with both themes.
- Type-check, lint and unit tests pass, with at least one test per component for its main state.
- You list any class in onecare.css that no component uses.
```

## Prompt 2: data model, mock services, state

```text
Build the data layer from SPEC sections 5, 6 and 8.

- src/types: the types named in SPEC section 8.
- src/data: the 16-vaccine catalog, the 14 health questions with the exact wording from docs/reference/A10-Health.html, and seed data for the reference scenario plus one patient with no record.
- src/services: the six mock services behind TypeScript interfaces, each async with a short delay. readCard returns the sample fields with a confidence value. searchAddress returns up to five US suggestions from a small local list.
- src/state: one store for the sign-up draft (React context and reducer unless the repository already uses something else). Selectors for: which sections exist (helper or self), section completion, age-based field rules, visible vaccine list and its order, the one-line summary of each section.
- src/state/deviceMemory.ts: read, write, expire and forget as SPEC section 6 says, with an explicit allow-list of fields. Behind a config flag.

Done when:
- Unit tests cover: age rules at 17, 18, 64 and 65; vaccine ordering; section summaries; device memory never containing any field on the "Never store" list (assert on the serialized JSON); expiry after 30 days; the app working when localStorage throws.
- Type-check, lint and tests pass.
```

## Prompt 3: both shells with placeholder sections

```text
Build the two shells and the routes. Sections are placeholders for now: each shows its title and a Continue button.

Option A at /a (match A03 to A13 and A-Desktop for layout):
- One page, panels in order. One main panel open at a time. Finished panels fold to their summary; the head is a button that reopens the panel for editing.
- Sticky progress bar with six segments, "Section n of 6", and a "Sections" button that opens the bottom sheet from A13-Jump.html. Choosing a section opens it and scrolls to it.
- From 900px wide, switch to the two-column layout in A-Desktop.html: clinic card and section list on the side, no progress bar.

Option B at /b (match B03 to B12 and B-Desktop for layout):
- One step per route, Back and a primary button at the bottom, five stamps at the top.
- From 900px wide, the pass sits in the side column and fills in as steps finish.

Both:
- Start screen and Done screen routes exist but can be empty.
- "Myself" removes the helper section: five panels in A; no "And who are you?" step in B.
- Browser Back, refresh and deep links keep the draft and land on the right section.
- Moving focus: when a panel or step opens, focus goes to its heading.

Done when:
- I can click through both options end to end with placeholders at 390px and 1280px.
- Tests cover: opening a finished panel, the jump sheet, the self path, Back in B.
- Type-check, lint and tests pass.
```

## Prompt 4: Start, Patient, Your details

```text
Replace the placeholders for Start, Patient and Your details. Follow SPEC 5.1, 5.2 and 5.5 and match these references: A01, A02, A03, A04, A08, B01, B02, B03, B04, B08.

- Start: language choice, clinic card (pass in B), who is it for. When device memory has a draft, show "Welcome back" first with "Continue" and "Forget what is saved on this phone".
- Patient: the four fields; lookup after name and date of birth; the found state with masked review rows and the not-found note. "This is not [name]" clears the fields.
- Date of birth: three numeric inputs with auto-advance, validation for real dates, and a clear error for a date in the future.
- Your details: the five fields with correct autocomplete and inputmode attributes.
- Validation: on blur and on Continue, with the message under the field and focus moved to the first error.

Done when:
- Both seed patients behave as the spec says in both options.
- Tests cover found, not found, invalid date, under-18 forcing the helper path.
- Type-check, lint and tests pass.
```

## Prompt 5: Vaccines

```text
Build the Vaccines section from SPEC 5.3. Match A05-Vaccines.html and B05-Vaccines.html, and the wide layout in B-Desktop.html.

- The list comes from the clinic's offered vaccines filtered by the age rules config. Vaccines not allowed for the age appear in the single muted line.
- Tapping a row selects and expands it; only one row is expanded at a time; a selected, folded row shows its chosen product in one line.
- Expanded content in the order the spec gives. The three disclosure rows start folded and show placeholder copy from the catalog when opened.
- Product choice per SPEC, including "Other options (n)", "No preference" and "I'd like to ask the pharmacist". Hide product choice entirely when the clinic flag is off.
- The "had it" warning with "Keep it" and "Remove".
- "I'm not sure what [name] needs" clears nothing; it is sent along with any selections.
- Keyboard: the checkbox toggles selection, Enter or Space on the row expands it, disclosures are buttons.

Done when:
- All 16 vaccines can be reached by changing the seed patient's age and the clinic config.
- Tests cover: ordering, single expansion, product default from history, warning on a "had" vaccine, flag off.
- Type-check, lint and tests pass.
```

## Prompt 6: Insurance, camera, card reading

```text
Build Insurance and Medicare from SPEC 5.4. Match A06, A07, B06, B07 and the desktop version in A-Desktop.html.

- "Take a photo" calls getUserMedia immediately (rear camera preferred) and opens the in-page camera view with the card frame. Capture to a canvas, then show the photo with "Use this photo" and "Retake".
- If getUserMedia is missing or permission is denied, fall back without an error screen to a file input with capture="environment". "Upload photos I already have" uses a file input without capture.
- After each photo call the mock readCard, fill the fields, and show them for checking. Mark low-confidence fields so the person looks at them.
- "Type it in instead" shows the six manual fields.
- Medicare number and last 4 of SSN show for age 65 and over. Format the Medicare number as the person types.
- Desktop: two drop zones with drag and drop, plus the "Use your phone's camera" tile with a placeholder QR code.
- Stop the camera stream whenever the view closes.

Done when:
- The flow works with camera allowed, camera denied and no camera.
- Tests mock getUserMedia for all three cases and check that SSN and Medicare number never reach device memory.
- Type-check, lint and tests pass.
```

## Prompt 7: Save time at the clinic, and Health questions

```text
Build the optional section from SPEC 5.6. Match A09, A10, B09, B10.

- Four sub-panels with summaries. One open at a time.
- Health questions: 14 questions, three answers each, all starting as No. The summary line counts the answers changed from No.
- More about [name]: sex and race, each with a "Prefer not to say" choice.
- Home address: type-ahead from the mock service after three characters, keyboard navigable (combobox pattern), "Type the address by hand" for manual entry. Prefill from the record when there is one.
- Reminders: phone and email.
- "Continue to sign" and "Skip for now" side by side or stacked with equal weight. Skipped items are remembered for the Done screen.

Done when:
- Skipping everything still reaches Sign.
- Tests cover the combobox with keyboard only, the answer count, skip.
- Type-check, lint and tests pass.
```

## Prompt 8: Review and sign, Done

```text
Build Review and sign and the Done screen from SPEC 5.7 and 5.8. Match A11, A12, B11, B12.

- Review: in A the folded panels are the review; in B render the review list. Tapping a row goes to that section and returns to Sign afterwards.
- Who is signing, with the signer's name prefilled and editable.
- Signature: Type (default) renders the name in the script font; Draw is a canvas with Clear. The typed-signature agreement checkbox is required in Type mode.
- Two required consents. The vaccine information link opens placeholder content.
- On submit, call submitSignup with the signature record the spec lists, then show Done.
- Done: clinic details, vaccines requested, "Add to calendar" as an .ics download, "Sign up another person" keeping helper details, "Still open" rows for skipped extras, the device memory notice with "Forget what is saved on this phone".
- In B the Done screen is the finished pass with all stamps.

Done when:
- A full sign-up works in both options for both seed patients.
- Tests cover: submit blocked until consents and signature are complete, typed and drawn signatures, "Sign up another person".
- Type-check, lint and tests pass.
```

## Prompt 9: Spanish and Chinese

```text
Add es and zh-Hans dictionaries for every string, and wire the language choice through Start, the header and device memory. Set the lang attribute on the html element.

- Translate interface strings yourself. For the 14 health questions and the two consents, add your translation but mark each entry with needsReview: true and list them in docs/TRANSLATION-REVIEW.md.
- Dates and names: format dates with Intl for the chosen language; do not reorder name fields.
- Check every screen in all three languages at 390px for overflow or broken layout and fix the layout, not the wording.

Done when:
- A test fails if any key is missing from any dictionary.
- You give me a list of screens where text grew enough to change the layout.
```

## Prompt 10: accessibility and responsive pass

```text
Audit both options against WCAG 2.1 AA and fix what you find.

- Run axe on every route in both options and both seed patients. Zero serious or critical issues.
- Keyboard only: complete a sign-up in A and in B. Fix any focus trap, lost focus or missing focus ring.
- Screen reader names for every control, including icon buttons, stamps and progress.
- Zoom the text to 140% with the A+ control and to 200% with browser zoom at 390px: nothing clipped, nothing overlapping, no horizontal scroll.
- Check 320px, 390px, 768px, 1280px.
- Honor prefers-reduced-motion.

Done when:
- You give me the axe results and a short list of what you changed.
- Type-check, lint and tests pass.
```

## Prompt 11: visual parity with the references

```text
Compare the build with the static references.

- Write a Playwright script that opens each docs/reference/*.html file and the matching route and state in the app at the same viewport (390 wide for phone screens, 1280 for the two desktop screens) and saves both screenshots side by side into docs/parity/.
- For each pair, list the visible differences in spacing, type size, color, border and wording.
- Fix differences in the app. Do not edit the reference files. If the app is right and the reference is wrong according to the spec, say so and leave it.

Done when:
- docs/parity/ has a pair for every reference file and a REPORT.md with the remaining differences and the reason for each.
```

## Prompt 12 (later): move into the OneCare app

```text
We are moving this prototype into the existing OneCare application.

First, read the existing app and reply with: its framework, routing, state, styling approach, API client, and how the current clinic sign-up page is built. Do not change code yet.

Then propose a plan that:
- keeps src/styles/onecare.css and the section components unchanged where possible,
- replaces each mock service with the real endpoint behind the same interface, listing any field the API lacks,
- puts option A and option B behind a per-pharmacy setting so OneCare can compare them,
- keeps device memory behind its config flag, off by default.

Wait for my approval of the plan before starting.
```
