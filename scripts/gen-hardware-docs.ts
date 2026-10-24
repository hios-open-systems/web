// Genera projects/<slug>/hardware/{README.md, BOM.csv, schematic.svg} desde
// config/hardware/. Con --check no escribe: falla si algún archivo publicado
// quedó distinto de lo que genera el modelo (lo usa test:hardware).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { HARDWARE_BOMS } from '../config/hardware/boms.ts';
import { HARDWARE_DESIGNS } from '../config/hardware/designs.ts';
import { renderBomCsv, renderWiringMd } from '../lib/hardware/docs.ts';
import { renderSchematicSvg } from '../lib/hardware/schematic.ts';

export function hardwareOutputs(): Map<string, string> {
  const files = new Map<string, string>();
  for (const design of HARDWARE_DESIGNS) {
    const bom = HARDWARE_BOMS[design.slug] ?? [];
    const dir = join('projects', design.slug, 'hardware');
    files.set(join(dir, 'README.md'), renderWiringMd(design, bom));
    files.set(join(dir, 'BOM.csv'), renderBomCsv(bom));
    files.set(join(dir, 'schematic.svg'), renderSchematicSvg(design));
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [path, content] of hardwareOutputs()) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (current === content) continue;
    if (check) {
      console.error(`✗ ${path} está desactualizado: corré npm run gen:hardware`);
      stale += 1;
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    console.log(`✓ ${path}`);
  }
  if (stale) process.exit(1);
}
