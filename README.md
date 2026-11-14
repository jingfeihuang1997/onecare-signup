# OneCare vaccine sign-up prototype

Two versions of one sign-up flow for a pharmacy vaccination clinic, side by side:

- `/a` "Calm and clear": one page, a panel per section, finished panels fold into a summary.
- `/b` "Clinic pass": one step per screen, with a pass that collects a stamp for each step.
- `/kit`: every component in both themes.

**This is a demo.** Every person, pharmacy and card in it is made up, every service is a mock, and nothing you type leaves your browser. Please do not enter real personal information.

## Run it

Needs Node 22.

```bash
npm install
npm run dev
```

Then open `http://localhost:5173/a` or `http://localhost:5173/b`.

Try "Maria Lopez", born 04 12 1954, to see a patient the pharmacy already has on record. Any other name is treated as new.

## Check it

```bash
npm run typecheck
npm run lint
npm test
```

## Where things are

| Path | What it holds |
|---|---|
| `docs/SPEC.md` | The build spec. Section 10 lists later decisions and wins over the reference pages. |
| `docs/reference/` | One static page per screen and state. |
| `docs/TO-BE-VERIFIED.md` | Everything mocked, drafted or assumed, and who needs to confirm it. |
| `docs/TRANSLATION-REVIEW.md` | Spanish and Chinese texts that need a professional translator. |
| `docs/ACCESSIBILITY.md` | The WCAG 2.1 AA audit and how to run it again. |
| `src/sections/` | The sections both versions share. |
| `src/shells/` | What differs between the two versions. |
| `src/i18n/` | Every string, in English, Spanish and Simplified Chinese. |
| `src/services/` | The mock services behind one interface. |

## Publishing

Pushing to `main` runs `.github/workflows/pages.yml`, which tests, builds and publishes to GitHub Pages. In the repository settings, set Pages > Source to "GitHub Actions" once.
