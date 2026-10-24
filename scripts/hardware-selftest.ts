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
const NODE_PINS: Record<string, string> = {
  'Botón PTT': 'BTN_PIN', 'LED estado': 'LED_PIN', 'I2C SDA': 'SDA_PIN', 'I2C SCL': 'SCL_PIN', 'VBAT ADC': 'VBAT_PIN',
  'I2S Amp BCLK': 'AMP_BCLK_PIN', 'I2S Amp LRC': 'AMP_LRC_PIN', 'I2S Amp DIN': 'AMP_DIN_PIN',
  'I2S Mic SCK': 'MIC_SCK_PIN', 'I2S Mic WS': 'MIC_WS_PIN', 'I2S Mic SD': 'MIC_SD_PIN',
};
assert.equal(Object.keys(NODE_PINS).length, design('hios-node-ai').pins.length, '[hios-node-ai] pin sin constante de firmware');
for (const [signal, name] of Object.entries(NODE_PINS)) {
  assert.equal(gpioOf('hios-node-ai', signal), constant(nodeSrc, name), `[hios-node-ai] ${signal} ≠ ${name}`);
}
assert.ok(!/WIFI_PASS\s*=\s*"/.test(nodeSrc), '[hios-node-ai] credenciales WiFi hardcodeadas en main.cpp');

// 4. Un GPIO no disponible en el ESP32-S3 N16R8 nunca puede publicarse como verificado ni callado.
// GPIO 0–21 y 26–48 existen en el S3; en el N16R8, 26–37 los usan la flash y la PSRAM octal.
const S3_GPIOS = new Set([...Array.from({ length: 22 }, (_, i) => i), ...Array.from({ length: 11 }, (_, i) => i + 38)]);
for (const d of HARDWARE_DESIGNS.filter((x) => x.mcu.includes('S3'))) {
  for (const pin of d.pins.filter((p) => !S3_GPIOS.has(p.gpio))) {
    assert.equal(d.status, 'draft', `[${d.slug}] GPIO${pin.gpio} no está disponible en el S3 N16R8 y el diseño figura como verificado`);
    assert.ok(d.warnings.some((w) => w.includes(`GPIO${pin.gpio}`)), `[${d.slug}] GPIO${pin.gpio} inválido sin advertencia`);
  }
}

console.log(`✓ hardware: ${HARDWARE_DESIGNS.length} diseños, esquemas/BOM al día y pines contra firmware`);
