import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { HARDWARE_BOMS } from '../config/hardware/boms.ts';
import { HARDWARE_DESIGNS } from '../config/hardware/designs.ts';
import { renderBomCsv } from '../lib/hardware/docs.ts';
import { renderSchematicSvg } from '../lib/hardware/schematic.ts';
import { hardwareOutputs } from './gen-hardware-docs.ts';

// 1. Lo publicado en projects/<slug>/hardware/ es exactamente lo que genera el modelo.
for (const [path, content] of hardwareOutputs()) {
  assert.ok(existsSync(path), `${path} falta: corré npm run gen:hardware`);
  assert.equal(readFileSync(path, 'utf8'), content, `${path} desactualizado: corré npm run gen:hardware`);
}

// 2. Cada diseño tiene BOM, cada pin aparece en el esquema y cada fuente existe.
for (const design of HARDWARE_DESIGNS) {
  const bom = HARDWARE_BOMS[design.slug];
  assert.ok(bom && bom.length > 0, `[${design.slug}] sin BOM`);
  const svg = renderSchematicSvg(design);
  for (const pin of design.pins) assert.ok(svg.includes(`GPIO${pin.gpio}<`), `[${design.slug}] GPIO${pin.gpio} no está en el esquema`);
  const gpios = design.pins.map((p) => p.gpio);
  assert.equal(new Set(gpios).size, gpios.length, `[${design.slug}] GPIO duplicado`);
  assert.ok(design.pins.every((p) => design.modules.some((m) => m.id === p.module)), `[${design.slug}] pin con módulo inexistente`);
  for (const item of bom) assert.ok(existsSync(item.source), `[${design.slug}] fuente inexistente: ${item.source}`);
  const lines = renderBomCsv(bom).trim().split('\n');
  assert.equal(lines.length, bom.length + 1, `[${design.slug}] CSV con filas de más o de menos`);
}

// 3. Diseños sin guía de cableado: sus pines tienen que coincidir con el firmware.
const constant = (src: string, name: string): number => {
  const m = src.match(new RegExp(`\\b${name}\\s*=\\s*(\\d+)`));
  assert.ok(m, `no encontré ${name}`);
  return Number(m[1]);
};
const design = (slug: string) => HARDWARE_DESIGNS.find((d) => d.slug === slug)!;
const gpioOf = (slug: string, signal: string): number => {
  const pin = design(slug).pins.find((p) => p.signal === signal);
  assert.ok(pin, `[${slug}] falta la señal ${signal}`);
  return pin.gpio;
};

for (const file of ['projects/speaker-test/src/tone_test.cpp', 'projects/speaker-test/src/song.cpp']) {
  const src = readFileSync(file, 'utf8');
  assert.equal(gpioOf('speaker-test', 'I2S BCLK'), constant(src, 'PIN_BCLK'), `${file}: BCLK`);
  assert.equal(gpioOf('speaker-test', 'I2S LRC'), constant(src, 'PIN_LRC'), `${file}: LRC`);
  assert.equal(gpioOf('speaker-test', 'I2S DIN'), constant(src, 'PIN_DIN'), `${file}: DIN`);
}

const nodeSrc = readFileSync('projects/hios-node-ai/src/main.cpp', 'utf8');
assert.equal(gpioOf('hios-node-ai', 'Botón PTT'), constant(nodeSrc, 'BTN_PIN'));
assert.equal(gpioOf('hios-node-ai', 'LED estado'), constant(nodeSrc, 'LED_PIN'));
assert.equal(gpioOf('hios-node-ai', 'I2C SDA'), constant(nodeSrc, 'SDA_PIN'));
assert.equal(gpioOf('hios-node-ai', 'I2C SCL'), constant(nodeSrc, 'SCL_PIN'));

// 4. Un GPIO que no existe en el ESP32-S3 nunca puede publicarse como verificado ni callado.
const S3_GPIOS = new Set([...Array.from({ length: 22 }, (_, i) => i), ...Array.from({ length: 23 }, (_, i) => i + 26)]);
for (const d of HARDWARE_DESIGNS.filter((x) => x.mcu.includes('S3'))) {
  for (const pin of d.pins.filter((p) => !S3_GPIOS.has(p.gpio))) {
    assert.equal(d.status, 'draft', `[${d.slug}] GPIO${pin.gpio} no existe en el S3 y el diseño figura como verificado`);
    assert.ok(d.warnings.some((w) => w.includes(`GPIO${pin.gpio}`)), `[${d.slug}] GPIO${pin.gpio} inválido sin advertencia`);
  }
}

console.log(`✓ hardware: ${HARDWARE_DESIGNS.length} diseños, esquemas/BOM al día y pines contra firmware`);
