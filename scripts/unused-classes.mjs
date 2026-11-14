// Lists classes defined in src/styles/onecare.css that no file in src/components uses.
// Run with: npm run css:unused
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync('src/styles/onecare.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const defined = new Set([...css.matchAll(/\.((?:oc|is)-[\w-]+|oc)(?![\w-])/g)].map((m) => m[1]));

const dir = 'src/components';
const source = readdirSync(dir)
  .filter((name) => name.endsWith('.tsx') && !name.endsWith('.test.tsx'))
  .map((name) => readFileSync(join(dir, name), 'utf8'))
  .join('\n');

const unused = [...defined]
  .filter((name) => !new RegExp(String.raw`(?<![\w-])${name}(?![\w-])`).test(source))
  .sort();

console.log(`${defined.size} classes defined, ${unused.length} not used by a component:`);
for (const name of unused) console.log(`  .${name}`);
