/**
 * Registro declarativo de calculadoras.
 *
 * Única fuente de verdad de: qué calcs existen, en qué orden y categoría van, y
 * qué campos (con su valor por defecto) tiene cada una. De acá salen:
 *   - los DEFAULTS (antes triplicados en useState / parseNumber / parseString),
 *   - la serialización a URL (se escribe solo lo que difiere del default),
 *   - el sidebar agrupado por categoría,
 *   - qué calcs muestran el control de serie E (E12/E24).
 *
 * El RENDER de cada calc sigue viviendo en su `*Tab.tsx` (mapeado por id en
 * EmbeddedCalculators): el registry es data, no componentes, para no acoplar.
 * Las calcs nuevas (obra/clima/cotidianas) se dan de alta agregando un descriptor
 * acá + su bloque i18n `cards.<id>.*` + su Tab.
 */

export type CalcCategory = 'electronica' | 'obra' | 'clima' | 'cotidianas';

/** El orden en que se muestran las categorías en el sidebar. */
export const CATEGORY_ORDER: CalcCategory[] = ['electronica', 'obra', 'clima', 'cotidianas'];

export interface CalcField {
  /** clave del campo = nombre del useState y del query param en la URL */
  key: string;
  /** valor por defecto. Su tipo (number|string) define cómo se hidrata/serializa */
  default: number | string;
}

export interface CalcDef {
  /** id estable = key del tab y del `?tab=` */
  id: string;
  category: CalcCategory;
  /** muestra el control de serie E (E12/E24) dentro de esta calc */
  usesESeries?: boolean;
  fields: CalcField[];
}

/**
 * Orden de electrónica: `resistorLab` va PRIMERO (es la calc por defecto).
 * El resto conserva su orden histórico.
 */
export const CALCULATORS: CalcDef[] = [
  {
    id: 'resistorLab',
    category: 'electronica',
    fields: [
      { key: 'band1', default: '2' },
      { key: 'band2', default: '2' },
      { key: 'multiplierBand', default: '100' },
      { key: 'toleranceBand', default: '5' },
      { key: 'packageType', default: 'axial-carbon' },
      { key: 'wattage', default: 0.25 },
    ],
  },
  {
    id: 'led',
    category: 'electronica',
    usesESeries: true,
    fields: [
      { key: 'supply', default: 5 },
      { key: 'ledVf', default: 2 },
      { key: 'ledCurrent', default: 10 },
    ],
  },
  {
    id: 'cap',
    category: 'electronica',
    fields: [
      { key: 'rippleCurrent', default: 300 },
      { key: 'rippleDeltaV', default: 0.2 },
      { key: 'rippleFreq', default: 100000 },
    ],
  },
  {
    id: 'thermal',
    category: 'electronica',
    fields: [
      { key: 'powerV', default: 5 },
      { key: 'powerI', default: 0.4 },
      { key: 'thetaJa', default: 35 },
      { key: 'ambient', default: 30 },
    ],
  },
  {
    id: 'runtime',
    category: 'electronica',
    fields: [
      { key: 'batteryMah', default: 2500 },
      { key: 'avgCurrent', default: 180 },
      { key: 'efficiency', default: 85 },
    ],
  },
  {
    id: 'adc',
    category: 'electronica',
    usesESeries: true,
    fields: [
      { key: 'vinMax', default: 12 },
      { key: 'vadcMax', default: 3.1 },
      { key: 'rBottomK', default: 10 },
    ],
  },
  {
    id: 'rc',
    category: 'electronica',
    usesESeries: true,
    fields: [
      { key: 'rcR', default: 10000 },
      { key: 'rcC', default: 100 },
      { key: 'targetFc', default: 160 },
    ],
  },
  {
    id: 'rl',
    category: 'electronica',
    fields: [
      { key: 'rlR', default: 1000 },
      { key: 'rlL', default: 100 },
      { key: 'rlTargetFc', default: 1000 },
    ],
  },
  {
    id: 'rcl',
    category: 'electronica',
    fields: [
      { key: 'rclR', default: 10 },
      { key: 'rclL', default: 10 },
      { key: 'rclC', default: 1 },
      { key: 'rclF', default: 1000 },
    ],
  },
  {
    id: 'gain',
    category: 'electronica',
    fields: [
      { key: 'rf', default: 10000 },
      { key: 'rg', default: 1000 },
    ],
  },
  {
    id: 'i2s',
    category: 'electronica',
    fields: [
      { key: 'sampleRate', default: 44100 },
      { key: 'bitDepth', default: 16 },
      { key: 'channels', default: 2 },
      { key: 'mclkMult', default: 256 },
    ],
  },
];

/** id de la calc que abre por defecto = la primera del registry. */
export const DEFAULT_CALC_ID = CALCULATORS[0].id;

/** ids válidos para el `?tab=` (deriva del registry, sin lista duplicada). */
export const CALC_IDS = CALCULATORS.map((c) => c.id);

/** Todos los campos, aplanados. */
export const ALL_FIELDS: CalcField[] = CALCULATORS.flatMap((c) => c.fields);

/** Mapa key → default. Única fuente de defaults de todo el estado de inputs. */
export const DEFAULTS: Record<string, number | string> = Object.fromEntries(
  ALL_FIELDS.map((f) => [f.key, f.default]),
);

/** true si el campo es string (para hidratar/serializar sin castear mal). */
export const isStringField = (key: string): boolean => typeof DEFAULTS[key] === 'string';

/** ids de las calcs que usan la serie E (para mostrar el control E12/E24). */
export const ESERIES_CALC_IDS = new Set(
  CALCULATORS.filter((c) => c.usesESeries).map((c) => c.id),
);

/** Calcs agrupadas por categoría, respetando CATEGORY_ORDER. */
export const CALCULATORS_BY_CATEGORY: { category: CalcCategory; calcs: CalcDef[] }[] =
  CATEGORY_ORDER.map((category) => ({
    category,
    calcs: CALCULATORS.filter((c) => c.category === category),
  })).filter((g) => g.calcs.length > 0);
