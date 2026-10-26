// Regenera las guías de soldadura en PDF desde config/hardware/ (las mismas
// fuentes que hardware/README.md y schematic.svg). No corre en CI: los PDF no
// son byte-determinísticos. Correlo después de npm run gen:hardware.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { HARDWARE_BOMS } from '../config/hardware/boms.ts';
import { HARDWARE_DESIGNS } from '../config/hardware/designs.ts';
import { renderGuideHtml } from '../lib/hardware/docs.ts';
import { renderSchematicSvg } from '../lib/hardware/schematic.ts';

const { chromium } = createRequire(import.meta.url)('playwright');

/** dónde vive cada PDF; las rutas existentes se mantienen para no romper links */
const TARGETS: Record<string, string[]> = {
  btdac: ['projects/btdac/HIOS_BTDAC_Soldering_Guide.pdf', 'public/downloads/btdac/HIOS_BTDAC_Soldering_Guide.pdf'],
  speaker: ['projects/speaker/HIOS_Speaker_Soldering_Guide.pdf', 'public/downloads/speaker/HIOS_Speaker_Soldering_Guide.pdf'],
  pad: ['projects/pad/hardware/HIOS_PAD_Soldering_Guide.pdf'],
  'hios-node-ai': ['projects/hios-node-ai/hardware/HIOS_Node_AI_Soldering_Guide.pdf'],
};

// CHROMIUM_PATH: usar un Chromium ya instalado si el de Playwright no está descargado.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const design of HARDWARE_DESIGNS) {
  const [first, ...copies] = TARGETS[design.slug] ?? [];
  if (!first) continue;
  const bom = HARDWARE_BOMS[design.slug] ?? [];
  const page = await browser.newPage();
  await page.setContent(renderGuideHtml(design, bom, renderSchematicSvg(design)));
  mkdirSync(dirname(first), { recursive: true });
  await page.pdf({ path: first, format: 'A4', margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
  for (const copy of copies) copyFileSync(first, copy);
  console.log(`✓ ${[first, ...copies].join(', ')}`);
  await page.close();
}
await browser.close();
