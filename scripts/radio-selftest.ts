import assert from 'node:assert/strict';
import {
  wavelength, inductiveReactance, capacitiveReactance, resonantFrequency, bandwidth,
  resonatorResponse, butterworthLossDb, reflection, magnitude, swr, returnLossDb,
  reflectedPowerFraction, antennaLength, wattsToDbm, dbmToWatts, freeSpaceLossDb,
  radioHorizonKm, peakToRms, solveOhm, planeEarthLossDb, pathLossDb,
} from '../lib/radio/physics.ts';
import { COAX_CABLES, lossPer100m, cableLossDb, powerAfterLoss } from '../lib/radio/coax.ts';
import { QUIZ } from '../lib/radio/quiz.ts';
import { PHONETIC, Q_CODES, MORSE, KOCH_ORDER, textToMorse, morseToText, ditMs } from '../lib/radio/codes.ts';
import { BANDS } from '../lib/radio/bands.ts';
import { BANK_TECNICA } from '../lib/radio/bankTecnica.ts';
import { OFFICIAL_RULES } from '../lib/radio/officialBank.ts';
import { OFFICIAL_BAND_PLAN } from '../lib/radio/bandPlan.ts';
import { PROGRAM } from '../lib/radio/program.ts';
import { CHAPTERS } from '../lib/radio/chapters.ts';
import { EXAM_QUESTIONS, questionsFor, buildMock, MOCK_LAYOUT } from '../lib/radio/exam.ts';

const near = (a: number, b: number, tol: number, msg: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// Longitud de onda: 2 m a ~150 MHz, 40 m a ~7.5 MHz.
near(wavelength(146e6), 2.053, 0.01, 'λ 146 MHz');
near(wavelength(7.1e6), 42.22, 0.05, 'λ 7.1 MHz');

// Reactancias y resonancia: XL = XC en f0.
const L = 1e-6; const C = 100e-12;
const f0 = resonantFrequency(L, C);
near(f0, 15.915e6, 1e4, 'f0 1µH/100pF');
near(inductiveReactance(f0, L), capacitiveReactance(f0, C), 1e-6, 'XL = XC en f0');
near(bandwidth(7e6, 100), 70e3, 1e-6, 'BW = f0/Q');
near(resonatorResponse(f0, f0, 50), 1, 1e-12, 'respuesta pico');
near(resonatorResponse(f0 + bandwidth(f0, 50) / 2, f0, 50), Math.SQRT1_2, 0.01, '-3 dB en ±BW/2');

// Butterworth: -3 dB en el corte, 6 dB/octava por orden lejos del corte.
near(butterworthLossDb(10e6, 10e6, 5), 3.01, 0.01, 'LPF -3 dB en fc');
near(butterworthLossDb(40e6, 10e6, 5) - butterworthLossDb(20e6, 10e6, 5), 30, 0.2, '30 dB/oct orden 5');

// ROE.
assert.equal(magnitude(reflection({ re: 50, im: 0 })), 0);
near(swr(magnitude(reflection({ re: 100, im: 0 }))), 2, 1e-9, 'ROE 100 Ω');
near(swr(magnitude(reflection({ re: 25, im: 0 }))), 2, 1e-9, 'ROE 25 Ω');
near(magnitude(reflection({ re: 0, im: 0 })), 1, 1e-12, 'corto Γ=1');
near(magnitude(reflection({ re: 50, im: 50 })), 0.447, 0.001, 'Γ 50+j50');
assert.equal(swr(1), Infinity);
near(returnLossDb(1 / 3), 9.54, 0.01, 'RL ROE 2');
near(reflectedPowerFraction(1 / 3), 0.111, 0.001, 'potencia reflejada ROE 2');

// Antenas: dipolo 7.1 MHz ≈ 20 m, cuarto de onda 146 MHz ≈ 49 cm.
near(antennaLength(7.1e6, 0.5), 20.05, 0.05, 'dipolo 40 m');
near(antennaLength(146e6, 0.25), 0.4876, 0.002, 'λ/4 2 m');

// Decibeles y enlace.
near(wattsToDbm(1), 30, 1e-9, '1 W = 30 dBm');
near(dbmToWatts(53), 199.5, 0.1, '53 dBm ≈ 200 W');
near(freeSpaceLossDb(5, 146), 89.7, 0.1, 'FSPL 5 km 146 MHz');
near(planeEarthLossDb(5, 1.5, 1.5), 140.9, 0.1, 'tierra plana handies');
near(pathLossDb(5, 146, 30, 30), freeSpaceLossDb(5, 146), 1e-9, 'antenas altas: espacio libre');
near(radioHorizonKm(10, 10), 26.06, 0.05, 'horizonte 10 m/10 m');
near(peakToRms(10), 7.071, 0.001, 'RMS');

// Ley de Ohm desde cualquier par.
const o = solveOhm('p', 100, 'r', 50);
assert.ok(o);
near(o.v, 70.71, 0.01, 'V desde P,R');
near(o.i, 1.414, 0.001, 'I desde P,R');
assert.equal(solveOhm('v', 1, 'v', 2), null);

// Coaxiles: más grueso pierde menos, más frecuencia pierde más.
const [rg58, rg213, lmr] = COAX_CABLES;
near(lossPer100m(rg58, 100), 15.4, 1e-9, 'punto exacto');
assert.ok(lossPer100m(rg58, 146) > lossPer100m(rg213, 146));
assert.ok(lossPer100m(rg213, 146) > lossPer100m(lmr, 146));
assert.ok(lossPer100m(lmr, 1300) > lossPer100m(lmr, 1000), 'extrapola creciente');
near(powerAfterLoss(10, cableLossDb(rg58, 100, 100 * 3 / 15.4)), 5.01, 0.01, '3 dB = mitad');

// Datos de práctica bien formados.
for (const q of QUIZ) {
  assert.ok(q.options.length >= 3, `opciones ${q.id}`);
  assert.ok(q.answer >= 0 && q.answer < q.options.length, `respuesta ${q.id}`);
  assert.ok(q.explain.length > 10, `explicación ${q.id}`);
}
assert.equal(new Set(QUIZ.map((q) => q.id)).size, QUIZ.length, 'ids únicos');
assert.equal(PHONETIC.length, 26);
assert.ok(Q_CODES.length >= 10);

// Morse ida y vuelta.
assert.equal(textToMorse('sos'), '... --- ...');
assert.equal(textToMorse('LU1 DXX'), '.-.. ..- .---- / -.. -..- -..-');
assert.equal(morseToText('.-.. ..- .---- / -.. -..- -..-'), 'LU1 DXX');
assert.equal(morseToText('·−·· ··−'), 'LU');
assert.equal(morseToText(textToMorse('Ñandú 73?')), 'NANDU 73?');
assert.equal(ditMs(20), 60);
for (const ch of KOCH_ORDER) assert.ok(MORSE[ch], `Koch ${ch}`);
assert.equal(new Set(KOCH_ORDER).size, KOCH_ORDER.length, 'Koch sin repetidos');

// Bandas ordenadas y sin solaparse.
for (let i = 1; i < BANDS.length; i++) assert.ok(BANDS[i].startMHz > BANDS[i - 1].endMHz, `orden ${BANDS[i].name}`);
for (const b of BANDS) assert.ok(b.endMHz > b.startMHz, b.name);

// Bancos de examen.
assert.equal(BANK_TECNICA.length, 150, 'banco técnico completo');
assert.deepEqual(BANK_TECNICA.map((q) => q.n), Array.from({ length: 150 }, (_, i) => i + 1), 'numeración 1..150');
assert.equal(OFFICIAL_RULES.length, 181, 'banco oficial Novicio completo');
assert.equal(new Set(OFFICIAL_RULES.map((q) => q.id)).size, OFFICIAL_RULES.length, 'ids oficiales únicos');
for (const q of OFFICIAL_RULES) assert.ok(q.ok.length && q.ok.every((i) => i >= 0 && i < q.opts.length), `clave ${q.id}`);
assert.deepEqual(OFFICIAL_RULES.find((q) => q.id === 'I.45')?.ok, [0, 2, 4, 6], 'I.45 = a, c, e y g');
assert.deepEqual(OFFICIAL_RULES.find((q) => q.id === 'PBN.1')?.ok, [0, 3], 'PBN.1 = a y d');
// Plan de bandas oficial: tramos ordenados y Novicio fuera de 30, 17 y 12 m.
for (const b of OFFICIAL_BAND_PLAN) assert.ok(b.endMHz > b.startMHz && b.rows.length, `plan ${b.name}`);
for (const n of ['30 m', '17 m', '12 m']) assert.ok(OFFICIAL_BAND_PLAN.filter((b) => b.name === n).every((b) => b.rows.every((r) => !r.cats.includes('N'))), `Novicio sin ${n}`);
assert.ok(OFFICIAL_BAND_PLAN.find((b) => b.name === '2 m')?.rows.some((r) => r.cats.includes('N')), 'Novicio en 2 m');
for (const q of EXAM_QUESTIONS) {
  const opts = q.options;
  assert.ok(q.q.trim() && opts.every((o) => o.trim()), `vacío ${q.key}`);
  // El banco oficial repite una opción en VII.5: lo dejamos literal.
  if (q.key !== 'rVII.5') assert.equal(new Set(opts).size, opts.length, `opciones repetidas ${q.key}`);
  assert.ok(opts.length >= 2 && q.correct.length >= 1, `opciones ${q.key}`);
}
assert.equal(new Set(EXAM_QUESTIONS.map((q) => q.key)).size, EXAM_QUESTIONS.length, 'keys únicas');
for (const pool of ['A', 'B', 'C', 'D', 'repaso'] as const) assert.ok(questionsFor(pool).length > 0, `pool ${pool}`);
let seed = 1;
const mock = buildMock(() => ((seed = (seed * 16807) % 2147483647) / 2147483647));
assert.equal(mock.length, MOCK_LAYOUT.tecnica + MOCK_LAYOUT.reglamento, 'largo simulacro');
assert.equal(new Set(mock.map((q) => q.key)).size, mock.length, 'simulacro sin repetidas');

// Cada punto del programa oficial apunta a secciones que existen.
for (const it of PROGRAM.flatMap((g) => g.items)) {
  for (const [href] of it.where) {
    const [slug, id] = href.split('#');
    assert.ok(CHAPTERS.find((c) => c.slug === slug)?.sections.some((s) => s.id === id), `programa ${it.code} → ${href}`);
  }
}

console.log(`All radio self-tests passed (${QUIZ.length} propias, ${BANK_TECNICA.length} técnicas, ${OFFICIAL_RULES.length} reglamento oficial)`);
