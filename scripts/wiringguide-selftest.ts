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

interface StdPin {
  gpio: number;
  kind: string;
  name: string;
  rail: number | null;
  dest: string;
  note?: string;
}
interface StdKeymap {
  cols: Array<{ c: number; gpio: number }>;
  rows: Array<{ r: number; gpio: number; name: string; keys: string[] }>;
  navRow: Array<{ kind: string; logic?: string; label?: string; gpio: number | string }>;
}
const stdCode = readFileSync(new URL('../projects/pad/pinout.data.js', import.meta.url), 'utf8');
const win: { PINOUT?: { pins: StdPin[]; keymap: StdKeymap } } = {};
new Function('window', stdCode)(win);
const std = win.PINOUT;
ok('standalone pinout.data.js loads', std !== undefined);

const pinKey = (p: StdPin) => `${p.gpio}|${p.kind}|${p.name}|${p.rail}|${p.dest}|${p.note ?? ''}`;
ok(
  'pad pins mirror the standalone pinout.data.js',
  !!std && JSON.stringify(std.pins.map(pinKey).sort()) === JSON.stringify(PAD_WIRING.pins.map(pinKey).sort()),
);

const kmKey = (k: StdKeymap) =>
  JSON.stringify({
    cols: k.cols.map((c) => [c.c, c.gpio]),
    rows: k.rows.map((r) => [r.r, r.gpio, r.name, r.keys]),
    nav: k.navRow.map((n) => (n.kind === 'btn' ? ['btn', n.logic, n.gpio] : ['aux', n.label, n.gpio])),
  });
ok('pad keymap mirrors the standalone pinout.data.js', !!std && kmKey(std.keymap) === kmKey(KEYMAP));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll wiring-guide self-tests passed');
