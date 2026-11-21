import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  wavelength, inductiveReactance, capacitiveReactance, resonantFrequency, bandwidth,
  resonatorResponse, resonanceHalfPowerEdges, butterworthLossDb, reflection, magnitude, swr, returnLossDb,
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
import { filteredHarmonicsDbc } from '../lib/radio/harmonics.ts';
import { sample, spectrum } from '../components/radio/widgets/modulation.ts';

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
for (const center of [1.8e6, 7.1e6, 450e6]) {
  for (const q of [2, 50, 300]) {
    const { low, high } = resonanceHalfPowerEdges(center, q);
    near(resonatorResponse(low, center, q), Math.SQRT1_2, 1e-10, 'corte inferior a media potencia');
    near(resonatorResponse(high, center, q), Math.SQRT1_2, 1e-10, 'corte superior a media potencia');
    near((low / center) * (high / center), 1, 1e-12, 'f₀ es media geométrica de los cortes');
    near((high - low) / bandwidth(center, q), 1, 1e-10, 'separación de los cortes = f₀/Q');
  }
}

// Butterworth: -3 dB en el corte, 6 dB/octava por orden lejos del corte.
near(butterworthLossDb(10e6, 10e6, 5), 3.01, 0.01, 'LPF -3 dB en fc');
near(butterworthLossDb(40e6, 10e6, 5) - butterworthLossDb(20e6, 10e6, 5), 30, 0.2, '30 dB/oct orden 5');

// Un RC con corte en f deja pasar 1/2 de la potencia de f y 1/5 de la de 2f.
// Una armónica de -20 dBc queda en -20 + 10·log10((1/5)/(1/2)), no -26,99 dBc.
const filtered = filteredHarmonicsDbc([0, -20], 1e6, 1e6, 1);
near(filtered[0], 0, 1e-12, 'portadora filtrada conserva referencia 0 dBc');
near(filtered[1], -23.979400086720375, 1e-10, 'armónica relativa a portadora filtrada');
const nearCutoff = filteredHarmonicsDbc([0, -15, -20, -28, -32], 146e6, 146e6 * 1.05, 1);
near(Math.max(...nearCutoff.slice(1)), -18.850470089181584, 1e-10, 'peor armónica con pérdida de portadora');

// Medición Fourier de la onda USB: fc = 24 y fm = 2 ciclos por pantalla.
function usbAmplitude(cycles: number, level: number, time: number): number {
  const count = 512;
  let real = 0; let imaginary = 0;
  for (let index = 0; index < count; index++) {
    const u = index / count;
    const value = sample('USB', u, time, level, 1).rf;
    real += value * Math.cos(2 * Math.PI * cycles * u);
    imaginary += value * Math.sin(2 * Math.PI * cycles * u);
  }
  return 2 * Math.hypot(real, imaginary) / count;
}
for (const time of [0, 1.25]) {
  const level = 0.7;
  const upper = spectrum('USB', level, 1).find((line) => line.offset === 1);
  assert.ok(upper, 'espectro USB contiene fc + fm');
  near(usbAmplitude(26, level, time), upper.amp, 1e-10, 'USB temporal coincide con espectro fc + fm');
  for (const cycles of [22, 24, 28]) near(usbAmplitude(cycles, level, time), 0, 1e-10, 'USB sin portadora ni frecuencias extra');
}
near(usbAmplitude(26, 0, 0), 0, 1e-12, 'USB sin audio no transmite');

// Fourier independently measures FM sidebands with the same beta passed to spectrum.
function fmAmplitude(cycles: number, level: number, beta: number): number {
  const count = 2048;
  let real = 0; let imaginary = 0;
  for (let index = 0; index < count; index++) {
    const u = index / count;
    const value = sample('FM', u, 0, level, beta).rf;
    real += value * Math.cos(2 * Math.PI * cycles * u);
    imaginary += value * Math.sin(2 * Math.PI * cycles * u);
  }
  return 2 * Math.hypot(real, imaginary) / count;
}
for (const [level, beta] of [[0, 5], [0.8, 0.2], [0.8, 1.5], [1, 5]]) {
  for (const line of spectrum('FM', level, beta)) {
    const measured = fmAmplitude(24 + 2 * line.offset, level, beta);
    // The finite carrier/audio ratio admits tiny high-order negative-frequency terms.
    near(measured, line.amp, 1e-6, 'onda FM coincide con amplitud del espectro');
  }
}

// ROE.
const openReflection = reflection(null);
assert.deepEqual(openReflection, { re: 1, im: 0 }, 'circuito abierto ideal tiene Γ = +1');
assert.equal(swr(magnitude(openReflection)), Infinity, 'circuito abierto ideal tiene ROE infinita');
assert.equal(reflectedPowerFraction(magnitude(openReflection)), 1, 'circuito abierto devuelve el 100 % de la potencia');
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

// Recalcula el ejemplo impreso: las ramas se redondean desde el valor completo.
const antennaChapter = readFileSync(new URL('../components/radio/chapters/ChapterC.tsx', import.meta.url), 'utf8');
const printedDipole = /L = ([\d,]+) \/ ([\d,]+) · ([\d,]+) = ([\d,]+) m/.exec(antennaChapter);
const printedArm = /Cada rama: ([\d,]+) m/.exec(antennaChapter);
assert.ok(printedDipole && printedArm, 'ejemplo de dipolo con datos y resultados');
const decimal = (text: string) => Number(text.replace(',', '.'));
const dipoleMeters = decimal(printedDipole[1]) / decimal(printedDipole[2]) * decimal(printedDipole[3]);
assert.equal(decimal(printedDipole[4]), Number(dipoleMeters.toFixed(2)), 'largo total impreso redondeado');
assert.equal(decimal(printedArm[1]), Number((dipoleMeters / 2).toFixed(2)), 'rama impresa redondeada desde el valor sin truncar');

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
