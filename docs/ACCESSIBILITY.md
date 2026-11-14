# Accessibility audit (WCAG 2.1 AA)

Audit of options A and B, Nov 14, 2026 (Prompt 10).

## How to run it again

- **In the browser, with color contrast.** Start the dev server, open `/a` or `/b`, and in the console run:

  ```js
  const { audit, summarize } = await import('/scripts/a11y-driver.js');
  summarize(await audit('/a', 'maria'));   // or '/b', and 'daniel'
  ```

  The driver fills in one whole sign-up and runs axe on every screen. Pass `{ axe: false }` as a third argument to measure sideways overflow only.
- **In the unit tests, without contrast.** `npm test` runs `src/test/a11y.test.tsx`: axe on every screen for both options and both seed patients, a sign-up completed with the keyboard only in each option, focus checks, page titles and reduced motion.

## axe results

axe-core, all rules, real browser (Chromium), English.

| Run | Width | Screens | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|---|---|
| A, Maria (helper path, record found) | 390 | 15 | 0 | 0 | 0 | 0 |
| A, Daniel (signing up himself, no record) | 390 | 13 | 0 | 0 | 0 | 0 |
| B, Maria | 390 | 15 | 0 | 0 | 0 | 0 |
| B, Daniel | 390 | 13 | 0 | 0 | 0 | 0 |
| A, Maria | 1280 | 15 | 0 | 0 | 0 | 0 |
| B, Maria | 1280 | 15 | 0 | 0 | 0 | 0 |

Screens covered in each run: Start; Patient empty, with errors, record found or no record; Your details empty and filled (helper path); Vaccines with nothing chosen and with a row open plus reminders; Insurance with nothing chosen and with fields and errors; Save time at the clinic; Health questions; Review and sign before and after the first press; Done.

The first run found one serious problem on every screen, now fixed: `label-content-name-mismatch` on the header buttons (see "What changed").

The same flows run in the unit tests (jsdom, color contrast off) with zero serious or critical findings, plus the jump sheet and the language menu.

## Widths, text size and zoom

Sideways overflow was measured on every screen of a full sign-up.

| Check | Result |
|---|---|
| 320px (A and B) | No overflow |
| 390px (A and B) | No overflow |
| 768px (A and B) | No overflow |
| 1280px (A and B) | No overflow |
| 390px with text at 140% from the A+ button (A and B) | No overflow |
| 195px, which is what a 390px phone shows at 200% browser zoom (A and B) | No overflow after the fix below |

## Keyboard

A sign-up was completed with Tab, Space, Enter and the arrow keys only, in A and in B (unit tests). Every control was reached by Tab in reading order, focus moved to the heading of each panel or step as it opened, and there was no focus trap outside the two dialogs that are meant to hold focus (jump sheet and camera).

## What changed

- **Header buttons.** "A−", "A+" and "EN" had an `aria-label` that did not contain the text they show (WCAG 2.5.3). Their names now start with the visible text: "A+ Larger text", "EN Language: English. Change language".
- **Focus no longer lands on nothing.** In these places the button that was pressed disappears, and focus now moves on:
  - "This is not Maria" and a tapped record row: to First name.
  - "Keep it" and "Remove" on a vaccine: to that vaccine's checkbox.
  - Leaving the health questions: to the "Health questions" row.
  - Picking a suggested address, "Type the address by hand", "Use a different address", "Search for the address instead": to the control that replaces it.
  - "Type it in instead": to Insurance company.
  - Closing the camera after taking a photo: to "Retake".
  - "Forget what is saved on this phone": to the question on Start, and to a new line "Nothing is saved on this phone now." on Done.
- **"Add a second card"** now stays in place and opens and closes its note, instead of vanishing.
- **Every page has one top-level heading.** The one-page view of option A had none, and Start in A could show "Welcome back" above its heading. Both now begin with a visually hidden "Vaccine sign-up" heading.
- **Heading levels do not skip.** Sub-panels, the health questions and "For Medicare" are level 3 under an option A panel and level 2 under an option B step heading.
- **Each screen names the browser tab**, for example "Vaccines · Cedar Lane Pharmacy vaccine sign-up" (WCAG 2.4.2).
- **The address suggestions list** exists only while it has suggestions, so there is never an empty list announced.
- **200% zoom.** Below 260px the page insets tighten and a vaccine's status chip may wrap. Before this, "Had it · Sep 2024" stuck out 14 to 30px on the Vaccines screen.

## Already in place before this audit

Real buttons, links and labelled inputs; `aria-expanded` on every disclosure; a visible 3px focus ring; 44px targets; errors shown with an icon and text and tied to their field; `prefers-reduced-motion` turning off transitions, the sheet animation and smooth scrolling; `<html lang>` following the chosen language; no `user-scalable=no`, so pinch zoom works.

## Not checked

- **No screen reader was used.** Names, roles and states were checked with axe and in the tests, not by listening with VoiceOver, TalkBack, NVDA or JAWS.
- **Clipping and overlap were checked by measuring sideways overflow**, not by looking at every screen at every size. Only a few screens were looked at by eye.
- **Reduced motion** was checked in the stylesheet and by a unit test of the scrolling, not with the browser setting switched on.
- **The camera view** was not in the browser audit, because the audit machine has no camera. It is covered by unit tests with a mocked camera.
- **Spanish and Chinese** were not run through axe in the browser. They share all markup with English; their layout was checked at 390px in Prompt 9.
- **Inline links** inside consent text are smaller than 44px. They are the one exception to the 44px rule (WCAG allows inline links).
