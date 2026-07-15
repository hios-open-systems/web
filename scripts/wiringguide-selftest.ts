import { readFileSync } from 'node:fs';
import {
  matchesQuery,
  parseInline,
  railClass,
  railLabel,
  sortByGpio,
  splitColumns,
} from '../config/pinouts/wiring.ts';
import type { WiringGuide } from '../config/pinouts/wiring.ts';
import { PAD_WIRING } from '../config/pinouts/pad.ts';
import { BTDAC_WIRING } from '../config/pinouts/btdac.ts';
import { SPEAKER_WIRING } from '../config/pinouts/speaker.ts';
import { ESP32_S3_BOARD } from '../config/pinouts/modules/mcu.ts';
import { EMPTY_CHECKLIST, isDone, parse, serialize, toggle } from '../lib/padWiring/checklist.ts';

const WIRING_GUIDES: Record<string, WiringGuide> = {
  pad: PAD_WIRING,
  btdac: BTDAC_WIRING,
  speaker: SPEAKER_WIRING,
};

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures += 1;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const KNOWN_KINDS = new Set([
  'io', 'adc', 'pwm', 'neo', 'mtx', 'i2s', 'i2c', 'spi', 'dac', 'dim', 'pwr5', 'pwr33', 'gnd',
]);

for (const [slug, guide] of Object.entries(WIRING_GUIDES) as [string, WiringGuide][]) {
  ok(`[${slug}] meta id matches slug`, guide.meta.id === slug);
  ok(`[${slug}] meta has title/subtitle/source`, !!guide.meta.title && !!guide.meta.subtitle && !!guide.meta.source);
  ok(`[${slug}] has pins, rails, checklist`, guide.pins.length > 0 && guide.rails.length > 0 && guide.check.length > 0);

  const gpios = guide.pins.map((p) => p.gpio);
  ok(`[${slug}] no duplicate gpio`, new Set(gpios).size === gpios.length);
  ok(`[${slug}] every pin kind is known`, guide.pins.every((p) => KNOWN_KINDS.has(p.kind)));
  ok(
    `[${slug}] every section row kind is known`,
    guide.sections.every((s) => (s.rows ?? []).every((r) => KNOWN_KINDS.has(r.kind))),
  );
}

const KEYMAP = PAD_WIRING.keymap!;
const mtx = new Set(PAD_WIRING.pins.filter((p) => p.kind === 'mtx').map((p) => p.gpio));
ok('keymap cols map to mtx pins', KEYMAP.cols.every((c) => mtx.has(c.gpio)));
ok('keymap rows map to mtx pins', KEYMAP.rows.every((r) => mtx.has(r.gpio)));

const keys = [
  ...KEYMAP.rows.flatMap((r) => r.keys),
  ...KEYMAP.navRow.map((n) => (n.kind === 'btn' ? n.logic : '')).filter(Boolean),
];
const want = ['ACC1', 'ACC2', 'ACC3', 'ACC4', 'ACC5', 'ACC6', 'ACC7', 'ACC8', 'ACC9', 'ACC10', 'ALT1', 'ALT2'];
ok('12 logical keys mapped', keys.length === 12 && want.every((w) => keys.includes(w)));

const readFirmware = (rel: string): string => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const intConst = (code: string, name: string): number | null => {
  const m = code.match(new RegExp(`\\b${name}\\b\\s*=?\\s*(0x[0-9a-fA-F]+|\\d+)`));
  return m ? Number(m[1]) : null;
};
const firmwareGpios = (code: string, names: string[]): (number | null)[] => names.map((n) => intConst(code, n));
const gpioSet = (guide: WiringGuide): string => guide.pins.map((p) => p.gpio).sort((a, b) => a - b).join(',');
const sortedNums = (nums: (number | null)[]): string =>
  nums.filter((n): n is number => n !== null).sort((a, b) => a - b).join(',');

const btdacFw = readFirmware('projects/btdac/src/HIOS_BTDAC.ino');
const btdacNames = ['I2S_BCK', 'I2S_LRCK', 'I2S_DOUT', 'LED_R', 'LED_G', 'LED_B'];
const btdacFwPins = firmwareGpios(btdacFw, btdacNames);
ok('btdac firmware exposes all pin constants', btdacFwPins.every((v) => v !== null));
ok('btdac guide mirrors firmware pins (27/14/13 I2S + 4/16/17 LED)', gpioSet(BTDAC_WIRING) === sortedNums(btdacFwPins));

const speakerFw = readFirmware('projects/speaker/src/main.ino');
const speakerNames = ['I2S_DOUT', 'I2S_BCLK', 'I2S_LRC', 'I2C_SDA', 'I2C_SCL', 'VBAT_PIN'];
const speakerFwPins = firmwareGpios(speakerFw, speakerNames);
ok('speaker firmware exposes all pin constants', speakerFwPins.every((v) => v !== null));
ok('speaker guide mirrors firmware pins (25/26/27 I2S + 21/22 I2C + 34 VBAT)', gpioSet(SPEAKER_WIRING) === sortedNums(speakerFwPins));
ok('speaker I2S_LRC is 27 (firmware wins over stale 22)', intConst(speakerFw, 'I2S_LRC') === 27);
ok('speaker LCD_ADDR 0x27 mirrored in guide', intConst(speakerFw, 'LCD_ADDR') === 0x27 && JSON.stringify(SPEAKER_WIRING).includes('0x27'));

const tokens = parseInline('a **b** `c` _d_ e');
ok('parseInline bold', tokens.some((t) => t.bold && t.text === 'b'));
ok('parseInline mono', tokens.some((t) => t.mono && t.text === 'c'));
ok('parseInline italic', tokens.some((t) => t.italic && t.text === 'd'));
ok('parseInline preserves text', tokens.map((t) => t.text).join('') === 'a b c d e');

const hardened = parseInline('foo snake_case bar _real_ baz');
ok('parseInline ignores snake_case underscores', hardened.every((t) => !t.italic || t.text === 'real'));
ok('parseInline keeps snake_case as text', hardened.map((t) => t.text).join('') === 'foo snake_case bar real baz');

const p40 = PAD_WIRING.pins.find((p) => p.gpio === 40)!;
ok('matchesQuery by dest', matchesQuery(p40, 'bclk'));
ok('matchesQuery by gpio', matchesQuery(p40, '40'));
ok('matchesQuery empty is truthy', matchesQuery(p40, ''));
ok('matchesQuery no match', !matchesQuery(p40, 'zzzzz'));

ok('railLabel', railLabel(5) === '5V' && railLabel(33) === '3V3' && railLabel(null) === '—');
ok('railClass', railClass(5) === 'r5' && railClass(33) === 'r33' && railClass(null) === 'rNone');

const gpios = PAD_WIRING.pins.map((p) => p.gpio);
const before = gpios.join();
const sorted = sortByGpio(PAD_WIRING.pins);
ok('sortByGpio ascending', sorted[0].gpio === 1);
ok('sortByGpio does not mutate', PAD_WIRING.pins.map((p) => p.gpio).join() === before);
const [left, right] = splitColumns(sorted);
ok('splitColumns partitions', left.length + right.length === sorted.length && left.length >= right.length);

let c = EMPTY_CHECKLIST;
c = toggle(c, 3);
ok('toggle adds', isDone(c, 3) && c.done.length === 1);
c = toggle(c, 3);
ok('toggle removes', !isDone(c, 3) && c.done.length === 0);
c = toggle(toggle(c, 1), 5);
ok('checklist round-trip', parse(serialize(c)).done.length === 2 && isDone(parse(serialize(c)), 5));
ok('parse null is empty', parse(null).done.length === 0);
ok('parse garbage is empty', parse('{nope').done.length === 0);
ok('parse wrong version is empty', parse(JSON.stringify({ version: 9, done: [1] })).done.length === 0);
ok('parse non-number is empty', parse(JSON.stringify({ version: 1, done: ['x'] })).done.length === 0);
ok('toggle is immutable', toggle(EMPTY_CHECKLIST, 0) !== EMPTY_CHECKLIST);

// ─── el pinout publicado contra EL FIRMWARE QUE HAY ─────────────────────────
// Éste es el chequeo que faltaba. La guía del pad describe el objetivo rev 0.9 y el
// firmware todavía es rev 0.8: pueden diferir, pero cada diferencia tiene que estar
// DECLARADA en `divergence`. Una divergencia callada es exactamente lo que mandó a
// alguien a soldar el pin equivocado.
const padPins = readFirmware('projects/pad/src/app/Pins.h');

/** lee un array `constexpr uint8_t NOMBRE[n] = {a, b, ...}` de Pins.h */
const arrConst = (code: string, name: string): number[] => {
  const m = code.match(new RegExp(`\\b${name}\\[\\d+\\]\\s*=\\s*\\{([^}]+)\\}`));
  return m ? m[1].split(',').map((s) => Number(s.trim())) : [];
};

/**
 * Qué pin de la guía DEBERÍA corresponder a cada cosa que el firmware declara.
 *
 * La correspondencia se escribe una vez, acá, en vez de adivinarla comparando
 * strings: el firmware dice `I2S_DOUT` y la guía dice "I2S DOUT" pero el firmware
 * dice `MTX_COL[2]` y la guía dice "Matriz COL 2". Lo que el test verifica de
 * verdad son los NÚMEROS de GPIO; esta tabla es el contrato de qué es cada uno.
 */
const firmwareUse = new Map<number, string>();

const filas = arrConst(padPins, 'MTX_FILA');
const cols = arrConst(padPins, 'MTX_COL');
const alts = arrConst(padPins, 'ALT');
ok('Pins.h expone la matriz 2×5 (MTX_FILA[2] + MTX_COL[5])', filas.length === 2 && cols.length === 5);
ok('Pins.h expone los 2 ALT directos', alts.length === 2);
ok('Pins.h ya NO tiene el BOTON[12] de rev 0.8', !/BOTON\[12\]/.test(padPins));

filas.forEach((g, f) => firmwareUse.set(g, `Matriz FILA ${f}`));
cols.forEach((g, c) => firmwareUse.set(g, `Matriz COL ${c}`));
alts.forEach((g, i) => firmwareUse.set(g, `Botón ALT${i + 1}`));

for (const [name, label] of [
  ['ENC_CLK', 'Encoder CLK'], ['ENC_DT', 'Encoder DT'], ['ENC_SW', 'Encoder SW'],
  ['STICK_X', 'Stick VRx'], ['STICK_Y', 'Stick VRy'], ['STICK_SW', 'Stick SW'],
  ['I2S_BCLK', 'I2S BCLK'], ['I2S_LRC', 'I2S LRC'], ['I2S_DOUT', 'I2S DOUT'],
  ['TFT_BL', 'TFT backlight'],
] as const) {
  const g = intConst(padPins, name);
  ok(`Pins.h expone ${name}`, g !== null);
  if (g !== null) firmwareUse.set(g, label);
}

// La matriz no puede pisarse con nada: 7 GPIO distintos, y ninguno repetido con
// los ALT ni con el I2S. Un choque acá se manifiesta como una tecla que dispara dos
// cosas, que es de las cosas más molestas de debuggear con la placa armada.
const mtxAll = [...filas, ...cols];
ok('los 7 GPIO de la matriz son distintos entre sí', new Set(mtxAll).size === 7);
ok(
  'la matriz no pisa a los ALT ni al bus I2S',
  new Set([...mtxAll, ...alts, intConst(padPins, 'I2S_BCLK'), intConst(padPins, 'I2S_LRC'), intConst(padPins, 'I2S_DOUT')]).size === 12,
);

const declared = new Map((PAD_WIRING.divergence ?? []).map((d) => [d.gpio, d]));
const guideByGpio = new Map(PAD_WIRING.pins.map((p) => [p.gpio, p]));

/**
 * ¿La guía y el firmware están diciendo LO MISMO en este pin?
 *
 * Los nombres no son idénticos a propósito: el firmware dice `ALT_2` y la guía dice
 * "Botón ALT2" (es lo que ves en la carcasa). Normalizamos (sin acentos, sin
 * separadores) y pedimos que uno contenga al otro. Sigue distinguiendo lo que
 * importa: "Matriz COL 4" NO contiene "ALT1" → eso es una divergencia de verdad.
 */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const agrees = (guideName: string, fwLabel: string) => {
  const [g, f] = [norm(guideName), norm(fwLabel)];
  return g.includes(f) || f.includes(g);
};

// (a) todo pin que el firmware usa tiene que existir en la guía
const missing = [...firmwareUse.keys()].filter((g) => !guideByGpio.has(g));
ok(`todo GPIO del firmware está en la guía${missing.length ? ` (faltan: ${missing.join(',')})` : ''}`, missing.length === 0);

// (b) donde guía y firmware NO coinciden, tiene que haber una divergencia declarada
const undeclared: string[] = [];
for (const [gpio, fwLabel] of firmwareUse) {
  const pin = guideByGpio.get(gpio);
  if (!pin) continue;
  if (!agrees(pin.name, fwLabel) && !declared.has(gpio)) {
    undeclared.push(`GPIO${gpio}: guía="${pin.name}" firmware="${fwLabel}"`);
  }
}
ok(
  `sin divergencias CALLADAS guía↔firmware${undeclared.length ? `\n    ${undeclared.join('\n    ')}` : ''}`,
  undeclared.length === 0,
);

// (c) y al revés: no declarar divergencias que ya no existen (docs que envejecen mintiendo)
const stale = [...declared.keys()].filter((g) => {
  const pin = guideByGpio.get(g);
  const fw = firmwareUse.get(g);
  return !!pin && !!fw && agrees(pin.name, fw);
});
ok(`sin divergencias declaradas de más${stale.length ? ` (ya coinciden: ${stale.join(',')})` : ''}`, stale.length === 0);

// (d) la divergencia declarada tiene que decir la verdad sobre el firmware
const wrongClaim = (PAD_WIRING.divergence ?? []).filter(
  (d) => firmwareUse.has(d.gpio) && !d.firmware.includes(firmwareUse.get(d.gpio)!),
);
ok(
  `cada divergencia describe bien al firmware${wrongClaim.length ? ` (mal: ${wrongClaim.map((d) => d.gpio).join(',')})` : ''}`,
  wrongClaim.length === 0,
);

// ─── el keymap: qué tecla FÍSICA es ACC1 ────────────────────────────────────
// Si esto se desalinea del firmware, apretás una tecla y dispara otra. El orden de
// las filas/columnas de la guía tiene que ser el MISMO array que el de Pins.h, no
// "los mismos GPIO en cualquier orden": ButtonMatrix mapea el índice de tecla como
// fila = i/5, columna = i%5, así que el orden ES el mapeo.
ok(
  'keymap: las filas de la guía son MTX_FILA en el mismo orden',
  JSON.stringify(KEYMAP.rows.map((r) => r.gpio)) === JSON.stringify(filas),
);
ok(
  'keymap: las columnas de la guía son MTX_COL en el mismo orden',
  JSON.stringify(KEYMAP.cols.map((c) => c.gpio)) === JSON.stringify(cols),
);
const navBtns = KEYMAP.navRow.filter((n) => n.kind === 'btn') as Array<{ logic: string; gpio: number }>;
ok(
  'keymap: ALT1/ALT2 de la guía son ALT[] del firmware, en orden',
  JSON.stringify(navBtns.map((n) => n.gpio)) === JSON.stringify(alts),
);
ok(
  'keymap: la fila 0 son ACC1–5 y la fila 1 ACC6–10 (= índice de tecla i → fila i/5)',
  JSON.stringify(KEYMAP.rows[0].keys) === JSON.stringify(['ACC1', 'ACC2', 'ACC3', 'ACC4', 'ACC5']) &&
    JSON.stringify(KEYMAP.rows[1].keys) === JSON.stringify(['ACC6', 'ACC7', 'ACC8', 'ACC9', 'ACC10']),
);

// ─── la pantalla vive en platformio.ini, no en Pins.h ────────────────────────
// WIRING.md decía CS=13 y platformio dice 10. Soldar el CS al 13 lo cortocircuita
// contra el DC. Que nunca más dependa de que alguien lea el doc correcto.
const padIni = readFirmware('projects/pad/platformio.ini');
const tftFlag = (name: string): number | null => {
  const m = padIni.match(new RegExp(`-D\\s+${name}\\s*=\\s*(-?\\d+)`));
  return m ? Number(m[1]) : null;
};
for (const [flag, guideName] of [
  ['TFT_CS', 'TFT CS'], ['TFT_MOSI', 'TFT MOSI'], ['TFT_SCLK', 'TFT SCLK'],
  ['TFT_DC', 'TFT DC'], ['TFT_RST', 'TFT RST'],
] as const) {
  const fw = tftFlag(flag);
  const pin = PAD_WIRING.pins.find((p) => p.name === guideName);
  ok(`${flag}=${fw} coincide con la guía ("${guideName}" → GPIO${pin?.gpio})`, fw !== null && pin?.gpio === fw);
}

// ─── módulos: el riel vive acá, y todo pin tiene dueño ───────────────────────
for (const [slug, guide] of Object.entries(WIRING_GUIDES) as [string, WiringGuide][]) {
  const ids = new Set(guide.modules.map((m) => m.id));
  const orphans = guide.pins.filter((p) => !ids.has(p.mod)).map((p) => p.gpio);
  ok(`[${slug}] todo pin pertenece a un módulo declarado${orphans.length ? ` (huérfanos: ${orphans.join(',')})` : ''}`, orphans.length === 0);
  ok(`[${slug}] todo módulo tiene al menos un pin o es de energía`,
    guide.modules.every((m) => m.step === 1 || guide.pins.some((p) => p.mod === m.id)));
  const steps = guide.modules.map((m) => m.step);
  ok(`[${slug}] los pasos de soldadura son únicos`, new Set(steps).size === steps.length);
}

// ─── el header de la placa contra la tabla oficial de Espressif ──────────────
// El bug que empezó todo: dibujábamos IO19/IO20 en J1 (no existen ahí), lo que corría
// 8 pines y ponía un "5V" donde en la placa real hay USB D−. Fixture = tabla oficial
// (esp-dev-kits, user_guide_v1.1). Si alguien "ordena" los GPIO, esto explota.
const J1 = ['3V3','3V3','RST','IO4','IO5','IO6','IO7','IO15','IO16','IO17','IO18','IO8','IO3','IO46','IO9','IO10','IO11','IO12','IO13','IO14','5V','GND'];
const J3 = ['GND','IO43','IO44','IO1','IO2','IO42','IO41','IO40','IO39','IO38','IO37','IO36','IO35','IO0','IO45','IO48','IO47','IO21','IO20','IO19','GND','GND'];
const silk = (pins: typeof ESP32_S3_BOARD.left) =>
  pins.map((p) => (p.labels.find((l) => l.primary) ?? p.labels[0]).text);
ok('J1 (izquierda) en el orden físico oficial', JSON.stringify(silk(ESP32_S3_BOARD.left)) === JSON.stringify(J1));
ok('J3 (derecha) en el orden físico oficial', JSON.stringify(silk(ESP32_S3_BOARD.right)) === JSON.stringify(J3));
ok('los headers tienen 22 pines cada uno', ESP32_S3_BOARD.left.length === 22 && ESP32_S3_BOARD.right.length === 22);

// todo GPIO que la guía manda a soldar tiene que EXISTIR en el header de la placa
const headerGpios = new Set(
  [...ESP32_S3_BOARD.left, ...ESP32_S3_BOARD.right]
    .map((p) => (p.labels.find((l) => l.primary) ?? p.labels[0]).text)
    .filter((t) => t.startsWith('IO'))
    .map((t) => Number(t.slice(2))),
);
const offBoard = PAD_WIRING.pins.filter((p) => !headerGpios.has(p.gpio)).map((p) => p.gpio);
ok(`todo GPIO de la guía existe en el header${offBoard.length ? ` (fantasma: ${offBoard.join(',')})` : ''}`, offBoard.length === 0);

// ADC1 = GPIO1–10 y nada más. Es el único ADC que anda con WiFi/BLE prendido, así que
// un pin 'adc' fuera de ese rango es un bug que sólo aparece cuando encendés la radio.
const adcPins = PAD_WIRING.pins.filter((p) => p.kind === 'adc');
ok('todo pin ADC de la guía está en ADC1 (GPIO1–10)', adcPins.every((p) => p.gpio >= 1 && p.gpio <= 10));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll wiring-guide self-tests passed');
