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

import { formatOhm } from './calc';
import { coolingLoad, ohmsLaw, paintLiters, ruleOfThree } from './calc-extra';

export type CalcCategory = 'electronica' | 'obra' | 'clima' | 'cotidianas';

/** El orden en que se muestran las categorías en el sidebar. */
export const CATEGORY_ORDER: CalcCategory[] = ['electronica', 'obra', 'clima', 'cotidianas'];

export interface CalcField {
  /** clave del campo = nombre del useState y del query param en la URL */
  key: string;
  /** valor por defecto. Su tipo (number|string) define cómo se hidrata/serializa */
  default: number | string;
  // --- metadata para el render genérico (los calcs con *Tab.tsx propio la ignoran) ---
  min?: number;
  step?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  /** sufijo (addonAfter): "m²", "V", "frig/m²"… */
  unit?: string;
}

/** Getter/traductor que recibe `result()` — evita acoplar el registry a React. */
export type Getter = (key: string) => number | string;
export type Translate = (key: string) => string;

/** Una línea de resultado a mostrar por el render genérico. */
export interface CalcResultLine {
  label: string;
  value: string;
  hint?: string;
  invalid?: boolean;
  invalidText?: string;
}

export interface CalcDef {
  /** id estable = key del tab y del `?tab=` */
  id: string;
  category: CalcCategory;
  /** muestra el control de serie E (E12/E24) dentro de esta calc */
  usesESeries?: boolean;
  fields: CalcField[];
  /** true → se renderiza con GenericCalcTab (calc declarada 100% acá) */
  generic?: boolean;
  /** solo genéricas: produce las líneas de resultado desde los valores actuales */
  result?: (get: Getter, t: Translate) => CalcResultLine[];
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

  // --- Fase 2: calcs no-electrónicas + Ley de Ohm (render genérico) -----------
  {
    id: 'ohm',
    category: 'electronica',
    generic: true,
    fields: [
      { key: 'ohmV', default: 5, min: 0, step: 0.1, sliderMin: 0, sliderMax: 48, sliderStep: 0.1, unit: 'V' },
      { key: 'ohmI', default: 20, min: 0, step: 1, sliderMin: 0, sliderMax: 2000, sliderStep: 1, unit: 'mA' },
    ],
    result: (get, t) => {
      const r = ohmsLaw(Number(get('ohmV')), Number(get('ohmI')));
      const p = r.watts >= 1 ? `${r.watts.toFixed(2)} W` : `${(r.watts * 1000).toFixed(0)} mW`;
      return [
        { label: t('cards.ohm.r_r'), value: formatOhm(r.rOhm), hint: `${t('cards.ohm.r_p')}: ${p}`, invalid: !r.valid, invalidText: t('cards.invalid') },
      ];
    },
  },
  {
    id: 'paint',
    category: 'obra',
    generic: true,
    fields: [
      { key: 'paintArea', default: 20, min: 0, step: 1, sliderMin: 0, sliderMax: 300, sliderStep: 1, unit: 'm²' },
      { key: 'paintCoats', default: 2, min: 1, step: 1, sliderMin: 1, sliderMax: 4, sliderStep: 1 },
      { key: 'paintCoverage', default: 10, min: 1, step: 0.5, sliderMin: 4, sliderMax: 16, sliderStep: 0.5, unit: 'm²/L' },
    ],
    result: (get, t) => {
      const r = paintLiters(Number(get('paintArea')), Number(get('paintCoats')), Number(get('paintCoverage')));
      return [
        { label: t('cards.paint.r_liters'), value: `${r.liters.toFixed(2)} L`, hint: `${t('cards.paint.r_cans')}: ${r.cans4L} × 4L`, invalid: !r.valid, invalidText: t('cards.invalid') },
      ];
    },
  },
  {
    id: 'cooling',
    category: 'clima',
    generic: true,
    fields: [
      { key: 'coolArea', default: 20, min: 0, step: 1, sliderMin: 0, sliderMax: 120, sliderStep: 1, unit: 'm²' },
      { key: 'coolFactor', default: 100, min: 0, step: 5, sliderMin: 60, sliderMax: 180, sliderStep: 5, unit: 'frig/m²' },
      { key: 'coolPeople', default: 2, min: 0, step: 1, sliderMin: 0, sliderMax: 12, sliderStep: 1 },
      { key: 'coolAppliances', default: 400, min: 0, step: 50, sliderMin: 0, sliderMax: 3000, sliderStep: 50, unit: 'W' },
    ],
    result: (get, t) => {
      const r = coolingLoad(Number(get('coolArea')), Number(get('coolFactor')), Number(get('coolPeople')), Number(get('coolAppliances')));
      return [
        { label: t('cards.cooling.r_frig'), value: `${Math.round(r.frigorias)} frig/h`, hint: `${Math.round(r.btu)} BTU/h`, invalid: !r.valid, invalidText: t('cards.invalid') },
        { label: t('cards.cooling.r_split'), value: `${r.splitFrig} frig`, hint: t('cards.cooling.r_split_hint') },
      ];
    },
  },
  {
    id: 'rule',
    category: 'cotidianas',
    generic: true,
    fields: [
      { key: 'ruleA', default: 3, min: 0, step: 1, sliderMin: 1, sliderMax: 100, sliderStep: 1 },
      { key: 'ruleB', default: 100, min: 0, step: 1, sliderMin: 0, sliderMax: 1000, sliderStep: 1 },
      { key: 'ruleC', default: 12, min: 0, step: 1, sliderMin: 0, sliderMax: 1000, sliderStep: 1 },
    ],
    result: (get, t) => {
      const r = ruleOfThree(Number(get('ruleA')), Number(get('ruleB')), Number(get('ruleC')));
      return [
        { label: t('cards.rule.r_x'), value: r.valid ? r.x.toFixed(2) : '—', hint: t('cards.rule.r_hint'), invalid: !r.valid, invalidText: t('cards.invalid') },
      ];
    },
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
