/* Matemática pura de las calcs no-electrónicas (obra / clima / cotidianas) y de
 * la Ley de Ohm. Framework-free y testeable por `npm run test:calc`.
 * Todos los factores llegan como argumentos → las calcs los exponen como campos
 * editables (nada hardcodeado). */

/** Pintura: litros = área × manos ÷ rendimiento (m²/L). */
export const paintLiters = (areaM2: number, coats: number, coverageM2L: number) => {
  const valid = areaM2 > 0 && coats > 0 && coverageM2L > 0;
  if (!valid) return { liters: 0, cans4L: 0, valid: false };
  const liters = (areaM2 * coats) / coverageM2L;
  return { liters, cans4L: Math.ceil(liters / 4), valid: true };
};

/** Splits comerciales típicos (frigorías/h). */
const SPLIT_STEPS = [2250, 3000, 4500, 6000, 9000, 12000];

/**
 * Carga térmica para climatizar (frigorías/h ≈ kcal/h). Regla práctica:
 *   frig = superficie × factor + personas×100 + equipos(W)×0.86
 * `factor` (frig/m²) es configurable (≈100 estándar, sube con sol/cocina).
 * 1 frigoría/h = 3.968 BTU/h. Sugiere el split comercial ≥ carga.
 */
export const coolingLoad = (areaM2: number, factorFrigM2: number, people: number, appliancesW: number) => {
  const valid = areaM2 > 0 && factorFrigM2 > 0;
  if (!valid) return { frigorias: 0, btu: 0, splitFrig: 0, valid: false };
  const frigorias = areaM2 * factorFrigM2 + people * 100 + appliancesW * 0.86;
  const btu = frigorias * 3.968;
  const splitFrig = SPLIT_STEPS.find((s) => s >= frigorias) ?? SPLIT_STEPS[SPLIT_STEPS.length - 1];
  return { frigorias, btu, splitFrig, valid: true };
};

/** Ley de Ohm: dados V y I (mA) → R y P. */
export const ohmsLaw = (voltsV: number, currentMa: number) => {
  const currentA = currentMa / 1000;
  const valid = voltsV > 0 && currentA > 0;
  if (!valid) return { rOhm: 0, watts: 0, valid: false };
  return { rOhm: voltsV / currentA, watts: voltsV * currentA, valid: true };
};

/** Regla de tres directa: si A → B, entonces C → X = B·C/A. */
export const ruleOfThree = (a: number, b: number, c: number) => {
  if (a === 0) return { x: 0, valid: false };
  return { x: (b * c) / a, valid: true };
};
