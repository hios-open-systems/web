/**
 * Self-test de las operaciones puras de patrones (repeat/fill/rango).
 * Run: node --experimental-strip-types scripts/patternops-selftest.ts
 */
import { createNote, TICKS_PER_STEP, PPQ } from '../lib/workbench/chiptune.ts';
import { notesInRange, shiftNotes, repeatRange, fillSubdivision } from '../lib/workbench/patternOps.ts';

let failures = 0;
function ok(name: string, cond: boolean, detail = '') {
  if (!cond) { failures += 1; console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`); }
  else console.log(`✓ ${name}`);
}
function eq(name: string, got: unknown, want: unknown) {
  ok(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

const notes = [createNote(60, 0, 120, 100), createNote(64, 120, 120, 100), createNote(67, 240, 120, 100)];

// notesInRange
eq('notesInRange [0,240) -> 2', notesInRange(notes, 0, 240).length, 2);
eq('notesInRange [240,480) -> 1', notesInRange(notes, 240, 480).length, 1);

// shiftNotes: ids nuevos, start desplazado
const shifted = shiftNotes(notes, 480);
eq('shiftNotes conserva cantidad', shifted.length, 3);
eq('shiftNotes desplaza start', shifted[0].start, 480);
ok('shiftNotes crea ids nuevos', shifted.every((n, i) => n.id !== notes[i].id));

// repeatRange: patrón [0,240) tileado hasta 720
const rep = repeatRange(notes, 0, 240, 720);
const starts = rep.map((n) => n.start).sort((a, b) => a - b);
eq('repeatRange cantidad', rep.length, 4);
eq('repeatRange starts', JSON.stringify(starts), JSON.stringify([240, 360, 480, 600]));
ok('repeatRange no repite ids', new Set(rep.map((n) => n.id)).size === rep.length);
ok('repeatRange no excede untilTick', rep.every((n) => n.start < 720));
eq('repeatRange span<=0 -> vacío', repeatRange(notes, 100, 100, 720).length, 0);

// fillSubdivision: corcheas (240t) en [0,960)
const eighths = fillSubdivision(42, 0, 4 * PPQ, PPQ / 2);
eq('fill corcheas cantidad', eighths.length, 8);
eq('fill spacing', eighths[1].start - eighths[0].start, PPQ / 2);
ok('fill pitch correcto', eighths.every((n) => n.pitch === 42));
// semicorcheas (120t = TICKS_PER_STEP) en un compás 4/4 (1920t) -> 16
eq('fill semicorcheas', fillSubdivision(60, 0, 4 * PPQ, TICKS_PER_STEP).length, 16);
eq('fill rango inválido -> vacío', fillSubdivision(60, 500, 100, 120).length, 0);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll patternOps self-tests passed');
