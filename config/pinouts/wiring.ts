export type PinKind = 'io' | 'adc' | 'pwm' | 'neo' | 'mtx' | 'i2s' | 'i2c' | 'spi' | 'dac' | 'dim';
export type BadgeKind = PinKind | 'pwr5' | 'pwr33' | 'gnd';
export type Rail = 5 | 33 | null;
export type Palette = Record<BadgeKind, string>;

export interface Pin {
  gpio: number;
  kind: PinKind;
  name: string;
  rail: Rail;
  dest: string;
  note?: string;
}

export interface RailInfo {
  k: 'c5' | 'c33' | 'cg';
  t: string;
  c: string;
}

export interface SectionRow {
  pin: string;
  kind: BadgeKind;
  nm: string;
  to?: string;
  note?: string;
}

export type SectionGroup = 'power' | 'buttons' | 'audio' | 'misc';

export interface PinoutSection {
  t: string;
  cnt?: string;
  ascii?: string;
  tip?: string;
  rows?: SectionRow[];
  group?: SectionGroup;
}

export interface MatrixCol {
  c: number;
  gpio: number;
}

export interface MatrixRow {
  r: number;
  gpio: number;
  name: string;
  keys: string[];
}

export type NavKey =
  | { kind: 'btn'; logic: string; gpio: number }
  | { kind: 'aux'; label: string; gpio: string };

export interface KeyMap {
  cols: MatrixCol[];
  rows: MatrixRow[];
  navRow: NavKey[];
}

export interface WiringMeta {
  id: string;
  title: string;
  subtitle: string;
  rev: string;
  mcu: string;
  note: string;
  source: string;
}

export interface WiringGuide {
  meta: WiringMeta;
  pins: Pin[];
  rails: RailInfo[];
  sections: PinoutSection[];
  check: string[];
  keymap?: KeyMap;
  ampSdSteps?: string[];
}

export interface InlineToken {
  text: string;
  bold?: boolean;
  mono?: boolean;
  italic?: boolean;
}

export const railLabel = (rail: Rail): string =>
  rail === 5 ? '5V' : rail === 33 ? '3V3' : '—';

export const railClass = (rail: Rail): 'r5' | 'r33' | 'rNone' =>
  rail === 5 ? 'r5' : rail === 33 ? 'r33' : 'rNone';

export const sortByGpio = (pins: Pin[]): Pin[] =>
  [...pins].sort((a, b) => a.gpio - b.gpio);

export function splitColumns<T>(rows: T[]): [T[], T[]] {
  const half = Math.ceil(rows.length / 2);
  return [rows.slice(0, half), rows.slice(half)];
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|(?<![A-Za-z0-9])_[^_]+_(?![A-Za-z0-9]))/g;

export const parseInline = (text: string): InlineToken[] =>
  text
    .split(INLINE_PATTERN)
    .filter((part) => part !== '')
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**')) return { text: part.slice(2, -2), bold: true };
      if (part.startsWith('`') && part.endsWith('`')) return { text: part.slice(1, -1), mono: true };
      if (part.startsWith('_') && part.endsWith('_')) return { text: part.slice(1, -1), italic: true };
      return { text: part };
    });

export const matchesQuery = (pin: Pin, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    String(pin.gpio).includes(q) ||
    pin.name.toLowerCase().includes(q) ||
    pin.dest.toLowerCase().includes(q) ||
    (pin.note ?? '').toLowerCase().includes(q) ||
    railLabel(pin.rail).toLowerCase().includes(q)
  );
};
