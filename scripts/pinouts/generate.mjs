/**
 * Regenerates every public/pinouts/modules/<id>.html from the shared template.
 * Run: node scripts/pinouts/generate.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderPinout } from './template.mjs';
import { MODULES } from './data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', '..', 'public', 'pinouts', 'modules');

for (const m of MODULES) {
  const html = renderPinout(m);
  const file = join(outDir, `${m.id}.html`);
  writeFileSync(file, html);
  const pins = m.left.length + m.right.length;
  console.log(`✓ ${m.id}.html  (${pins} pines, chip=${m.chip.type}, cats=${m.categories.length})`);
}
