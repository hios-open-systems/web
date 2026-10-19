import { preferredResistance } from '../electronics/resistors.ts';
export { E_SERIES } from '../electronics/series.ts';
/**
 * Código de colores de resistencias: bandas <-> valor.
 *
 * La idea del estándar (IEC 60062): cada color codifica un dígito, un
 * multiplicador (potencia de 10) y/o una tolerancia. Una resistencia de
 * 4 bandas es [dígito, dígito, multiplicador, tolerancia]; una de 5 bandas
 * agrega un tercer dígito para más precisión.
 *
 * Módulo 100% puro: sin React, sin DOM, sin APIs de Node — corre igual
 * en el browser que en un script.
 */

export type ResistorColor =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'grey'
  | 'white'
  | 'gold'
  | 'silver';

export interface BandColor {
  color: ResistorColor;
  hex: string;
  digit: number | null;
  multiplier: number;
  tolerance: number | null;
}

/**
 * La tabla completa del estándar. `digit: null` significa que ese color no
 * puede ser banda de dígito (oro y plata solo multiplican o toleran);
 * `tolerance: null`, que no es válido como banda de tolerancia.
 */
export const BAND_COLORS: BandColor[] = [
  { color: 'black', hex: '#1a1a1a', digit: 0, multiplier: 1, tolerance: null },
  { color: 'brown', hex: '#7b3f00', digit: 1, multiplier: 10, tolerance: 1 },
  { color: 'red', hex: '#d32f2f', digit: 2, multiplier: 100, tolerance: 2 },
  { color: 'orange', hex: '#ef6c00', digit: 3, multiplier: 1_000, tolerance: null },
  { color: 'yellow', hex: '#f9d100', digit: 4, multiplier: 10_000, tolerance: null },
  { color: 'green', hex: '#2e7d32', digit: 5, multiplier: 100_000, tolerance: 0.5 },
  { color: 'blue', hex: '#1565c0', digit: 6, multiplier: 1_000_000, tolerance: 0.25 },
  { color: 'violet', hex: '#7b1fa2', digit: 7, multiplier: 10_000_000, tolerance: 0.1 },
  { color: 'grey', hex: '#757575', digit: 8, multiplier: 100_000_000, tolerance: 0.05 },
  { color: 'white', hex: '#fafafa', digit: 9, multiplier: 1_000_000_000, tolerance: null },
  { color: 'gold', hex: '#c9a227', digit: null, multiplier: 0.1, tolerance: 5 },
  { color: 'silver', hex: '#b0b0b0', digit: null, multiplier: 0.01, tolerance: 10 },
];

// Índice color -> fila de la tabla, para no buscar linealmente en cada consulta.
const BY_COLOR: Record<ResistorColor, BandColor> = BAND_COLORS.reduce(
  (acc, band) => {
    acc[band.color] = band;
    return acc;
  },
  {} as Record<ResistorColor, BandColor>,
);

export const DIGIT_COLORS: ResistorColor[] = BAND_COLORS.filter(
  (b) => b.digit !== null,
).map((b) => b.color);

export const MULTIPLIER_COLORS: ResistorColor[] = BAND_COLORS.map((b) => b.color);

export const TOLERANCE_COLORS: ResistorColor[] = BAND_COLORS.filter(
  (b) => b.tolerance !== null,
).map((b) => b.color);

export interface ResistorValue {
  ohms: number;
  tolerancePct: number;
  display: string;
}

function isDigitColor(color: ResistorColor): boolean {
  return BY_COLOR[color].digit !== null;
}

function isMultiplierColor(color: ResistorColor): boolean {
  return Number.isFinite(BY_COLOR[color].multiplier);
}

function isToleranceColor(color: ResistorColor): boolean {
  return BY_COLOR[color].tolerance !== null;
}

/**
 * Bandas -> valor. La estructura es siempre:
 * [dígitos...] + [multiplicador] + [tolerancia], con 2 o 3 dígitos según
 * sean 4 o 5 bandas. Los dígitos forman el "significando" (ej: rojo-violeta
 * = 27) y el multiplicador lo escala (×100 -> 2.7 kΩ).
 */
export function bandsToValue(bands: ResistorColor[]): ResistorValue | { error: string } {
  if (bands.length !== 4 && bands.length !== 5) {
    return { error: 'Resistor must have 4 or 5 bands' };
  }

  const digitCount = bands.length - 2;
  const digits: number[] = [];
  for (let i = 0; i < digitCount; i += 1) {
    const band = BY_COLOR[bands[i]];
    if (!isDigitColor(bands[i]) || band.digit === null) {
      return { error: `Band ${i + 1} (${bands[i]}) is not a valid digit color` };
    }
    digits.push(band.digit);
  }

  const multiplierColor = bands[digitCount];
  if (!isMultiplierColor(multiplierColor)) {
    return { error: `Band ${digitCount + 1} (${multiplierColor}) is not a valid multiplier` };
  }
  const multiplier = BY_COLOR[multiplierColor].multiplier;

  const toleranceColor = bands[digitCount + 1];
  if (!isToleranceColor(toleranceColor)) {
    return { error: `Band ${digitCount + 2} (${toleranceColor}) is not a valid tolerance` };
  }
  const tolerance = BY_COLOR[toleranceColor].tolerance;
  if (tolerance === null) {
    return { error: `Band ${digitCount + 2} (${toleranceColor}) is not a valid tolerance` };
  }

  // [2, 7] -> 27: cada dígito corre el acumulado una posición decimal.
  const significand = digits.reduce((acc, d) => acc * 10 + d, 0);
  const ohms = significand * multiplier;

  return { ohms, tolerancePct: tolerance, display: formatOhms(ohms) };
}

function toleranceToColor(tolerancePct: number): ResistorColor | null {
  const match = BAND_COLORS.find((b) => b.tolerance === tolerancePct);
  return match ? match.color : null;
}

function multiplierToColor(multiplier: number): ResistorColor | null {
  // Comparación con tolerancia relativa: los multiplicadores fraccionarios
  // (0.1, 0.01) no son exactos en binario, así que `===` fallaría.
  const match = BAND_COLORS.find(
    (b) => Math.abs(b.multiplier - multiplier) < multiplier * 1e-9 + 1e-12,
  );
  return match ? match.color : null;
}

/**
 * Valor -> bandas (el camino inverso). El truco es la notación científica:
 * separamos el valor en significando [1, 10) y exponente, los dígitos salen
 * del significando y el multiplicador del exponente. Si el valor no cae
 * exacto en los dígitos disponibles, lo ajustamos a la serie E del caso
 * (E24 para 4 bandas, E96 para 5).
 */
export function valueToBands(
  ohms: number,
  bandCount: 4 | 5,
  tolerancePct = 5,
): ResistorColor[] | { error: string } {
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return { error: 'Resistance must be a positive number' };
  }

  const toleranceColor = toleranceToColor(tolerancePct);
  if (toleranceColor === null) {
    return { error: `No band color for tolerance ${tolerancePct}%` };
  }

  const digitCount = bandCount - 2;
  const series = bandCount === 4 ? 'e24' : 'e96';

  // Normalizamos a significando en [1, 10) con su exponente (potencia de 10).
  let exponent = Math.floor(Math.log10(ohms));
  let significand = ohms / 10 ** exponent;
  // Guarda contra la deriva de punto flotante que puede sacar el
  // significando de [1, 10) por un pelo.
  if (significand >= 10) {
    significand /= 10;
    exponent += 1;
  } else if (significand < 1) {
    significand *= 10;
    exponent -= 1;
  }

  const digitScale = digitCount - 1;
  const exactDigits = significand * 10 ** digitScale;
  const roundedDigits = Math.round(exactDigits);
  // Si el valor ya mapea limpio a dígitos enteros lo usamos tal cual;
  // si no, ajustamos el significando al valor E-series más cercano.
  const isExact = Math.abs(exactDigits - roundedDigits) < 1e-9;
  let significandDigits = isExact
    ? roundedDigits
    : Math.round((preferredResistance(significand, series) ?? significand) * 10 ** digitScale);
  if (significandDigits >= 10 ** digitCount) {
    significandDigits /= 10;
    exponent += 1;
  }
  const multiplier = 10 ** (exponent - digitScale);

  const multiplierColor = multiplierToColor(multiplier);
  if (multiplierColor === null) {
    return { error: `Resistance ${formatOhms(ohms)} is out of representable range` };
  }

  // Descomponemos el significando dígito a dígito, de mayor a menor peso.
  const digitColors: ResistorColor[] = [];
  const remaining = significandDigits;
  for (let i = digitCount - 1; i >= 0; i -= 1) {
    const place = 10 ** i;
    const digit = Math.floor(remaining / place) % 10;
    const match = BAND_COLORS.find((b) => b.digit === digit);
    if (!match) {
      return { error: `Cannot encode digit ${digit}` };
    }
    digitColors.push(match.color);
  }

  return [...digitColors, multiplierColor, toleranceColor];
}

/** 4700 -> "4.7 kΩ": elige el prefijo más grande que no deje el número en 0.x */
export function formatOhms(ohms: number): string {
  const units: { factor: number; suffix: string }[] = [
    { factor: 1_000_000_000, suffix: 'GΩ' },
    { factor: 1_000_000, suffix: 'MΩ' },
    { factor: 1_000, suffix: 'kΩ' },
    { factor: 1, suffix: 'Ω' },
  ];

  const unit = units.find((u) => Math.abs(ohms) >= u.factor) ?? units[units.length - 1];
  const scaled = ohms / unit.factor;
  // Recorta ceros de cola pero mantiene los decimales con significado (4.7, 1, 220).
  const text = Number.parseFloat(scaled.toFixed(3)).toString();
  return `${text} ${unit.suffix}`;
}
