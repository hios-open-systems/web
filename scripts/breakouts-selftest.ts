import { readFileSync } from 'node:fs';
import { KIND_ORDER, ROLE_LABEL, matchesBreakout } from '../config/pinouts/modules/breakout.ts';
import { MCU_BREAKOUTS } from '../config/pinouts/modules/mcu.ts';
import { AUDIO_BREAKOUTS } from '../config/pinouts/modules/audio.ts';
import { DISPLAY_BREAKOUTS } from '../config/pinouts/modules/display.ts';
import { INPUT_BREAKOUTS } from '../config/pinouts/modules/input.ts';
import { LED_BREAKOUTS } from '../config/pinouts/modules/led.ts';
import { POWER_BREAKOUTS } from '../config/pinouts/modules/power.ts';
import { BATTERY_BREAKOUTS } from '../config/pinouts/modules/battery.ts';
import { CONNECTOR_BREAKOUTS } from '../config/pinouts/modules/connector.ts';

const BREAKOUTS = [
  ...MCU_BREAKOUTS,
  ...AUDIO_BREAKOUTS,
  ...DISPLAY_BREAKOUTS,
  ...INPUT_BREAKOUTS,
  ...LED_BREAKOUTS,
  ...POWER_BREAKOUTS,
  ...BATTERY_BREAKOUTS,
  ...CONNECTOR_BREAKOUTS,
];
const get = (id: string) => BREAKOUTS.find((b) => b.id === id);

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures += 1;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const roleKeys = new Set(Object.keys(ROLE_LABEL));
const kindKeys = new Set(KIND_ORDER);
const builds = new Set(['pad', 'btdac', 'speaker']);

const ids = BREAKOUTS.map((b) => b.id);
ok('unique ids', new Set(ids).size === ids.length);
ok('every pin role is known', BREAKOUTS.every((b) => b.pins.every((p) => roleKeys.has(p.role))));
ok('every kind is known', BREAKOUTS.every((b) => kindKeys.has(b.kind)));
ok('every breakout has pins', BREAKOUTS.every((b) => b.pins.length > 0));
ok('every pin has a name', BREAKOUTS.every((b) => b.pins.every((p) => p.name.length > 0)));
ok('usedBy resolves to known builds', BREAKOUTS.every((b) => (b.usedBy ?? []).every((s) => builds.has(s))));
ok('search empty returns all', matchesBreakout(BREAKOUTS[0], '') && BREAKOUTS.every((b) => matchesBreakout(b, '')));
ok('covers 15 modules', BREAKOUTS.length === 15);

const max = get('max98357a')!;
const gainRows = max.gain!.rows;
const vinRow = gainRows.find((r) => r[0].includes('a Vin'));
ok('MAX98357 GAIN Vin = 6 dB', vinRow?.[1] === '6 dB');
ok('MAX98357 GAIN 100k→GND = 15 dB', gainRows.some((r) => r[0].includes('100k a GND') && r[1] === '15 dB'));
ok('MAX98357 GAIN has no Vin=15dB error', !gainRows.some((r) => r[0].includes('Vin') && r[1] === '15 dB'));
ok('MAX98357 SD Left is the high band', max.channel!.rows.some((r) => r[0].includes('1,4') && r[1] === 'Left'));

const pcm = get('pcm5102')!;
ok('PCM5102 has jumpers', !!pcm.jumpers);
ok(
  'PCM5102 is the breakout (no raw IC pins)',
  !pcm.pins.some((p) => ['XO', 'XI', 'AVDD', 'DVDD', 'VREF'].includes(p.name)),
);
ok('PCM5102 SCK goes to GND', pcm.pins.some((p) => p.name === 'SCK' && (p.to ?? '').includes('GND')));

const ili = get('ili9488')!;
ok('ILI9488 MISO is NC', ili.pins.some((p) => (p.alt === 'MISO' || p.name === 'SDO') && p.role === 'nc'));

const hw = get('hw-504')!;
ok('HW-504 supply is 3V3 (pwr33, not pwr5)', hw.pins.some((p) => p.name.includes('5V') && p.role === 'pwr33'));

const neo = get('ws2812')!;
ok('NeoPixel DIN is neo role', neo.pins.some((p) => p.name === 'DIN' && p.role === 'neo'));

const ky009 = get('ky-009')!;
ok('KY-009 R/G/B are PWM', ['R', 'G', 'B'].every((n) => ky009.pins.some((p) => p.name === n && p.role === 'pwm')));

interface PinoutsMessages {
  Pinouts: {
    Modules: Record<string, { description?: string }>;
    Kinds: Record<string, string>;
    tables: Record<string, string>;
    meta: Record<string, { title?: string; description?: string }>;
  };
}
const readMessages = (locale: string): PinoutsMessages =>
  JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'));

for (const locale of ['en', 'es', 'de', 'it']) {
  const { Pinouts } = readMessages(locale);
  ok(
    `[${locale}] every breakout has a translated description`,
    BREAKOUTS.every((b) => typeof Pinouts.Modules[b.id]?.description === 'string'),
  );
  ok(
    `[${locale}] every breakout kind has a label`,
    BREAKOUTS.every((b) => typeof Pinouts.Kinds[b.kind] === 'string'),
  );
  ok(
    `[${locale}] table titles exist`,
    ['gain', 'channel', 'jumpers'].every((k) => typeof Pinouts.tables[k] === 'string'),
  );
  ok(
    `[${locale}] wiring-guide metadata exists`,
    ['index', 'pad', 'btdac', 'speaker'].every(
      (k) => !!Pinouts.meta[k]?.title && !!Pinouts.meta[k]?.description,
    ),
  );
}

// ── estándar de contenido: todo board cumple lo mismo ────────────────────────
// Codificado como test para que no vuelva a degradarse en silencio. `datasheetUrl`
// queda fuera a propósito: un portaceldas o un jack 3.5mm no tienen datasheet, y
// exigirlo empujaría a inventar URLs.
for (const breakout of BREAKOUTS) {
  const id = breakout.id;
  ok(`[${id}] tiene summary`, breakout.summary.trim().length > 0);
  ok(`[${id}] tiene form`, !!breakout.form?.trim());
  ok(`[${id}] tiene iface`, !!breakout.iface?.trim());
  ok(`[${id}] tiene voltage`, !!breakout.voltage?.trim());
  ok(`[${id}] tiene al menos 1 pin`, breakout.pins.length > 0);
  ok(`[${id}] tiene al menos 1 nota`, (breakout.notes?.length ?? 0) > 0);
  ok(`[${id}] declara en qué build se usa`, (breakout.usedBy?.length ?? 0) > 0);
  ok(
    `[${id}] todo pin tiene nombre y rol`,
    breakout.pins.every((pin) => pin.name.trim().length > 0 && !!pin.role),
  );
}

ok(
  'los usedBy apuntan a builds reales',
  BREAKOUTS.every((b) => (b.usedBy ?? []).every((slug) => ['pad', 'btdac', 'speaker'].includes(slug))),
);

// ── pinout FÍSICO de las placas ──────────────────────────────────────────────
// Una MCU sin `board` degrada a un resumen por rangos ("IO1–IO10", "demás IOxx"),
// que no sirve para soldar. El pinout tiene que ser pin a pin y en orden.
const MCUS = BREAKOUTS.filter((b) => b.kind === 'mcu');
ok('toda MCU tiene pinout físico (board)', MCUS.every((b) => !!b.board));

for (const mcu of MCUS) {
  const board = mcu.board!;
  const all = [...board.left, ...board.right];

  ok(`[${mcu.id}] cada pin del header tiene al menos una etiqueta`, all.every((p) => p.labels.length > 0));
  ok(
    `[${mcu.id}] cada pin tiene exactamente una etiqueta de serigrafía`,
    all.every((p) => p.labels.filter((l) => l.primary).length === 1),
  );
  for (const [name, side] of [['left', board.left], ['right', board.right]] as const) {
    ok(
      `[${mcu.id}] header ${name}: posiciones consecutivas 1..${side.length} (sin huecos)`,
      side.every((pin, index) => pin.pos === index + 1),
    );
  }
}

const s3 = BREAKOUTS.find((b) => b.id === 'esp32-s3-devkitc-1')!;
const wroom = BREAKOUTS.find((b) => b.id === 'esp32-wroom-32')!;
ok('ESP32-S3 DevKitC-1 tiene los 44 pines', s3.board!.left.length + s3.board!.right.length === 44);
ok('ESP32-WROOM-32 DevKit tiene los 38 pines', wroom.board!.left.length + wroom.board!.right.length === 38);
ok(
  'el S3 marca IO35/36/37 como no usables (PSRAM octal del N16R8)',
  ['IO35', 'IO36', 'IO37'].every((io) =>
    s3.board!.right.some((p) => p.labels.some((l) => l.text === io && l.func === 'nc')),
  ),
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll breakout self-tests passed');
