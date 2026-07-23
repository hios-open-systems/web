/**
 * Ley de Ohm + potencia — resolutor completo.
 *
 * Con dos cualesquiera de las cuatro magnitudes DC (V, I, R, P) alcanzan
 * para derivar las otras dos, porque todas están atadas por dos relaciones:
 *
 *   V = I · R      (ley de Ohm)
 *   P = V · I      (potencia eléctrica)
 *
 * De ahí salen las variantes que usamos abajo: P = I²·R y P = V²/R.
 * Módulo 100% puro: sin React, sin DOM, sin APIs de Node — corre igual
 * en el browser que en un script.
 */

export interface OhmsValues {
  v: number;
  i: number;
  r: number;
  p: number;
}

export type OhmsInput = Partial<OhmsValues>;

const FIELDS = ['v', 'i', 'r', 'p'] as const;

/**
 * Redondea a 6 dígitos significativos. ¿Por qué? Al dividir floats aparecen
 * colas tipo 3.0000000000000004 que ensucian el resultado; 6 dígitos es más
 * precisión de la que cualquier componente real puede honrar.
 */
function round6(value: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  if (value === 0) {
    return 0;
  }
  const rounded = Number(value.toPrecision(6));
  // toPrecision puede devolver -0; lo normalizamos para no mostrar "-0".
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clean(values: OhmsValues): OhmsValues {
  return {
    v: round6(values.v),
    i: round6(values.i),
    r: round6(values.r),
    p: round6(values.p),
  };
}

/** Última barrera: si alguna división dio Infinity/NaN, devolvemos error claro. */
function finalize(values: OhmsValues): OhmsValues | { error: string } {
  for (const field of FIELDS) {
    if (!Number.isFinite(values[field])) {
      return { error: 'Result is not finite (check for division by zero).' };
    }
  }
  return clean(values);
}

/**
 * Recibe exactamente 2 de {v, i, r, p} y devuelve las 4 magnitudes.
 * Hay 6 combinaciones posibles (4 sobre 2); resolvemos cada una con la
 * fórmula directa en vez de iterar, así cada caso documenta su matemática
 * y sus divisiones por cero.
 */
export function solve(input: OhmsInput): OhmsValues | { error: string } {
  const provided = FIELDS.filter((field) => Number.isFinite(input[field]));

  if (provided.length !== 2) {
    return { error: `Provide exactly 2 of V, I, R, P (got ${provided.length}).` };
  }

  const v = input.v as number;
  const i = input.i as number;
  const r = input.r as number;
  const p = input.p as number;
  const has = (field: (typeof FIELDS)[number]) => provided.includes(field);

  // V & I -> R = V/I, P = V·I
  if (has('v') && has('i')) {
    if (i === 0) {
      return { error: 'Cannot derive R from V and I when I = 0 (division by zero).' };
    }
    return finalize({ v, i, r: v / i, p: v * i });
  }

  // V & R -> I = V/R, P = V²/R
  if (has('v') && has('r')) {
    if (r === 0) {
      return { error: 'Cannot derive I from V and R when R = 0 (division by zero).' };
    }
    return finalize({ v, i: v / r, r, p: (v * v) / r });
  }

  // V & P -> I = P/V, y con I ya tenemos R = V/I
  if (has('v') && has('p')) {
    if (v === 0) {
      return { error: 'Cannot derive I from V and P when V = 0 (division by zero).' };
    }
    const derivedI = p / v;
    if (derivedI === 0) {
      return { error: 'Cannot derive R when the derived current is 0 (division by zero).' };
    }
    return finalize({ v, i: derivedI, r: v / derivedI, p });
  }

  // I & R -> V = I·R, P = I²·R (sin divisiones: no puede fallar)
  if (has('i') && has('r')) {
    return finalize({ v: i * r, i, r, p: i * i * r });
  }

  // I & P -> V = P/I, R = P/I²
  if (has('i') && has('p')) {
    if (i === 0) {
      return { error: 'Cannot derive V from I and P when I = 0 (division by zero).' };
    }
    return finalize({ v: p / i, i, r: p / (i * i), p });
  }

  // R & P -> V = √(P·R), I = V/R  (única combinación restante)
  // Ojo: P·R negativo no tiene raíz real — no existe ese circuito DC.
  if (r < 0) {
    return { error: 'Cannot derive V from R and P when R is negative (no real solution).' };
  }
  const derivedV = Math.sqrt(p * r);
  if (r === 0) {
    return { error: 'Cannot derive I from R and P when R = 0 (division by zero).' };
  }
  return finalize({ v: derivedV, i: derivedV / r, r, p });
}
