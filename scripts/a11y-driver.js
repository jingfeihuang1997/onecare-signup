// Accessibility audit driver for the browser. It walks one sign-up through the real page
// and runs axe (including color contrast, which needs real rendering) on every screen.
//
// With the dev server running, open /a or /b, then in the browser console:
//   const { audit } = await import('/scripts/a11y-driver.js');
//   await audit('/a', 'maria');   // or '/b', and 'daniel'
//
// It returns one entry per screen: the axe violations and any sideways overflow.
// Development tool only: it is not part of the app bundle.

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadAxe() {
  if (window.axe) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/node_modules/axe-core/axe.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function setValue(element, value) {
  const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}

const byId = (id) => document.getElementById(id);
const button = (pattern) =>
  [...document.querySelectorAll('main button')].find((item) => pattern.test(item.textContent.trim()));

async function click(pattern) {
  const target = button(pattern);
  if (!target) throw new Error(`No button matching ${pattern} on ${location.pathname}`);
  target.click();
  await wait(450);
}

async function until(test, label) {
  for (let tries = 0; tries < 60; tries += 1) {
    if (test()) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label} on ${location.pathname}`);
}

/** Elements that stick out past the right edge of the page. */
function overflow() {
  const width = document.documentElement.clientWidth;
  const out = [...document.querySelectorAll('.oc *')]
    .filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.right > width + 1 && !element.classList.contains('oc-sr');
    })
    .map((element) => (typeof element.className === 'string' && element.className) || element.tagName);
  return { scroll: document.documentElement.scrollWidth - width, elements: [...new Set(out)].slice(0, 5) };
}

async function check(results, name) {
  const report = await window.axe.run(document, { resultTypes: ['violations'] });
  results.push({
    screen: name,
    path: location.pathname + location.search,
    violations: report.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      first: violation.nodes[0].target.join(' '),
      detail: violation.nodes[0].any[0]?.message ?? violation.nodes[0].failureSummary,
    })),
    overflow: overflow(),
  });
}

/** Only measures sideways overflow on each screen: for checking widths and text sizes. */
export async function audit(option, patient, { axe = true } = {}) {
  if (axe) await loadAxe();
  const results = [];
  const look = axe ? (name) => check(results, name) : async (name) => results.push({ screen: name, overflow: overflow() });
  const helperPath = patient === 'maria';

  await until(() => document.querySelector('.oc-card__title, .oc-pass__title'), 'the clinic');
  await look('Start');
  [...document.querySelectorAll('main .oc-choice--big')][helperPath ? 1 : 0].click();
  await wait(500);

  await look('Patient, empty');
  await click(/^Continue$/);
  await look('Patient, with errors');
  setValue(byId('patient-first-name'), helperPath ? 'Maria' : 'Daniel');
  setValue(byId('patient-last-name'), helperPath ? 'Lopez' : 'Brooks');
  setValue(byId('patient-dob-month'), helperPath ? '04121954' : '09231988');
  if (helperPath) {
    await until(() => document.querySelector('main .oc-review'), 'the record');
    await look('Patient, record found');
    await click(/^Yes, this is right$/);
    await look('Your details, empty');
    setValue(byId('helper-first-name'), 'Ana');
    setValue(byId('helper-last-name'), 'Lopez');
    setValue(byId('helper-relationship'), 'child');
    setValue(byId('helper-phone'), '(313) 555-0142');
    setValue(byId('helper-email'), 'ana.lopez@example.com');
    await wait(200);
    await look('Your details, filled');
    await click(/^Continue$/);
  } else {
    await until(() => document.querySelector('main .oc-note'), 'the not-found note');
    await look('Patient, no record');
    await click(/^Continue$/);
  }

  await until(() => document.querySelector('.oc-vax'), 'the vaccine list');
  await look('Vaccines, nothing chosen');
  for (const id of helperPath ? ['vaccine-rsv', 'vaccine-hpv', 'vaccine-flu'] : ['vaccine-hpv', 'vaccine-flu']) {
    byId(id).click();
    await wait(200);
  }
  await look('Vaccines, a row open and reminders');
  await click(/^Continue$/);

  await look('Insurance, nothing chosen');
  const kinds = [...document.querySelectorAll('input[name=insurance-kind]')];
  kinds[0].click();
  await wait(250);
  if (!helperPath) await click(/^Type it in instead$/);
  await click(/^Add a second card$/);
  await click(/^Continue$/);
  await look('Insurance, fields and errors');
  kinds[kinds.length - 1].click();
  await wait(250);
  await click(/^Continue$/);

  await until(() => document.querySelector('.oc-panel--sub'), 'the optional details');
  await look('Save time at the clinic');
  document.querySelector('.oc-panel--sub .oc-panel__head').click();
  await wait(400);
  await look('Health questions');
  await click(/^Save answers$/);
  await click(/^Skip for now$/);

  await until(() => byId('sign-signer-name'), 'the sign section');
  await look('Review and sign');
  await click(/^Sign/);
  await look('Review and sign, after the first press');
  await click(/^Sign/);
  await until(() => /\/done$/.test(location.pathname), 'Done');
  await wait(400);
  await look('Done');
  return results;
}

/** One line per screen: what failed, or "clean". */
export function summarize(results) {
  return results.map((entry) => {
    const serious = (entry.violations ?? []).filter((item) => item.impact === 'serious' || item.impact === 'critical');
    const lesser = (entry.violations ?? []).filter((item) => item.impact !== 'serious' && item.impact !== 'critical');
    return {
      screen: entry.screen,
      serious: serious.map((item) => `${item.id} x${item.nodes}: ${item.first} (${item.detail})`),
      lesser: lesser.map((item) => `${item.id}[${item.impact}] x${item.nodes}: ${item.first}`),
      overflow: entry.overflow.scroll || entry.overflow.elements.length ? entry.overflow : 0,
    };
  });
}
