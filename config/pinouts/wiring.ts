export type PinKind = 'io' | 'adc' | 'pwm' | 'neo' | 'mtx' | 'i2s' | 'i2c' | 'spi' | 'dac' | 'dim';
export type BadgeKind = PinKind | 'pwr5' | 'pwr33' | 'gnd';
export type Rail = 5 | 33 | null;
export type Palette = Record<BadgeKind, string>;

/**
 * Un módulo físico que soldás como unidad: la pantalla, el stick, los amplis.
 *
 * El RIEL vive acá y no en el Pin, y esa distinción no es cosmética: un pin de
 * señal (p.ej. el CS de la pantalla) NO va a ningún riel — va al GPIO. Lo que se
 * alimenta de un riel es el MÓDULO, por sus pines VCC/GND. Tener `rail` colgado de
 * cada señal decía, literalmente, que el CS iba a 5V. No iba.
 */
export interface ModuleInfo {
  id: string;
  name: string;
  icon: string;
  /** de qué riel come el MÓDULO (por su VCC), no la señal */
  rail: Rail;
  /** los pines de alimentación reales del módulo, tal como se sueldan */
  power: string;
  /** orden sugerido a la hora de soldar (1 = primero) */
  step: number;
  tip?: string;
}

export interface Pin {
  gpio: number;
  kind: PinKind;
  name: string;
  /** id del ModuleInfo dueño de este pin (el riel se lee de ahí) */
  mod: string;
  dest: string;
  note?: string;
}

/**
 * Divergencia DECLARADA entre la guía (lo que vas a soldar) y el firmware que hay
 * hoy en el repo. Existe para que nunca vuelva a haber una divergencia CALLADA:
 * el self-test compara la guía contra `Pins.h` y exige que cada diferencia esté
 * acá, con su motivo. Si aparece una que no está declarada, el test falla.
 */
export interface FirmwareDivergence {
  gpio: number;
  guide: string;
  firmware: string;
  why: string;
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
  /** id del Breakout de la placa — habilita ordenar la lista por el header físico */
  boardId?: string;
  note: string;
  source: string;
}

export interface WiringGuide {
  meta: WiringMeta;
  modules: ModuleInfo[];
  pins: Pin[];
  rails: RailInfo[];
  sections: PinoutSection[];
  check: string[];
  keymap?: KeyMap;
  ampSdSteps?: string[];
  /** diferencias guía↔firmware, declaradas a propósito (ver FirmwareDivergence) */
  divergence?: FirmwareDivergence[];
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

/**
 * Cómo ordenar la lista de pines. No es cosmético: cada orden es una ESTRATEGIA de
 * soldadura distinta, y elegir la equivocada te hace ir y venir por la placa.
 *
 *   gpio   → referencia rápida ("¿qué era el 38?"). Inútil para soldar.
 *   module → soldás un módulo entero y lo probás antes de seguir. Falla acotada.
 *   header → bajás por la tira de pines sin saltear. Menos errores de conteo,
 *            pero si te equivocás no sabés qué módulo rompiste.
 */
export type PinOrder = 'gpio' | 'module' | 'header';

export const PIN_ORDER_LABEL: Record<PinOrder, string> = {
  gpio: 'Por GPIO',
  module: 'Por módulo',
  header: 'Por header físico',
};

export const PIN_ORDER_HINT: Record<PinOrder, string> = {
  gpio: 'Referencia: buscar un pin puntual. No es un orden para soldar.',
  module: 'Soldá y probá un módulo entero antes de pasar al siguiente.',
  header: 'Bajá por la tira de pines sin saltear, como está en la placa.',
};

/** módulo por id, con un fallback honesto en vez de romper el render */
export const moduleOf = (guide: WiringGuide, pin: Pin): ModuleInfo =>
  guide.modules.find((m) => m.id === pin.mod) ?? {
    id: pin.mod,
    name: pin.mod,
    icon: '•',
    rail: null,
    power: '—',
    step: 99,
  };

/**
 * `headerPos` mapea GPIO → posición física en el header. Se arma desde el pinout de
 * la placa (la serigrafía), así que ordenar por header sigue el cobre real.
 */
export const orderPins = (
  guide: WiringGuide,
  order: PinOrder,
  headerPos?: Map<number, number>,
): Pin[] => {
  const pins = [...guide.pins];
  if (order === 'gpio') return pins.sort((a, b) => a.gpio - b.gpio);
  if (order === 'module') {
    return pins.sort((a, b) => {
      const sa = moduleOf(guide, a).step;
      const sb = moduleOf(guide, b).step;
      return sa !== sb ? sa - sb : a.gpio - b.gpio;
    });
  }
  // header: los que no están en el header (no debería haber) van al final
  const pos = (p: Pin) => headerPos?.get(p.gpio) ?? Number.MAX_SAFE_INTEGER;
  return pins.sort((a, b) => (pos(a) !== pos(b) ? pos(a) - pos(b) : a.gpio - b.gpio));
};

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

export const matchesQuery = (pin: Pin, query: string, mod?: ModuleInfo): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    String(pin.gpio).includes(q) ||
    pin.name.toLowerCase().includes(q) ||
    pin.dest.toLowerCase().includes(q) ||
    (pin.note ?? '').toLowerCase().includes(q) ||
    (mod?.name ?? pin.mod).toLowerCase().includes(q)
  );
};
