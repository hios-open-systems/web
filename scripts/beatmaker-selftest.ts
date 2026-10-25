/**
 * Self-test para el HIOS Beatmaker & Looper DAW.
 * Verifica modelos puros, serialización, presets, forking y decodificación.
 * Run: node --experimental-strip-types scripts/beatmaker-selftest.ts
 */

import {
  BEAT_PRESETS,
  SOUND_IDS,
  createDefaultProject,
  createProjectFromPreset,
  fillTrackSteps,
  forkBeat,
  parseBeat,
  randomizeBeat,
  serializeBeat,
} from '../lib/workbench/beatmaker.ts';

let failures = 0;
function ok(name: string, cond: boolean, detail = '') {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function eq(name: string, got: unknown, want: unknown) {
  ok(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

// 1. Sonidos y metadatos
eq('SOUND_IDS expone 8 sonidos urbanos', SOUND_IDS.length, 8);
ok('incluye 808 sub bass', SOUND_IDS.includes('808'));
ok('incluye kick y snare', SOUND_IDS.includes('kick') && SOUND_IDS.includes('snare'));
ok('incluye hihats y melodía', SOUND_IDS.includes('hihat') && SOUND_IDS.includes('melody'));

// 2. Proyecto por defecto
const def = createDefaultProject();
eq('def.stepsCount === 16', def.stepsCount, 16);
eq('def.tracks.length === 8', def.tracks.length, 8);
ok('def.bpm entre 60 y 180', def.bpm >= 60 && def.bpm <= 180);
ok('toda pista tiene 16 pasos', def.tracks.every((t) => t.steps.length === 16));

// 3. Presets por género
eq('hay al menos 4 presets base', BEAT_PRESETS.length >= 4, true);
for (const p of BEAT_PRESETS) {
  const proj = createProjectFromPreset(p);
  ok(`preset [${p.id}] genera proyecto válido con 8 pistas`, proj.tracks.length === 8);
  ok(`preset [${p.id}] tiene notas activas`, proj.tracks.some((t) => t.steps.some((s) => s.active)));
}

// 4. Serialización y deserialización round-trip
const encoded = serializeBeat(def);
ok('serializeBeat produce string base64url no vacío', typeof encoded === 'string' && encoded.length > 20);
const recovered = parseBeat(encoded);
ok('parseBeat recupera el proyecto', recovered !== null);
eq('recovered.name', recovered?.name, def.name);
eq('recovered.bpm', recovered?.bpm, def.bpm);
eq('recovered.tracks.length', recovered?.tracks.length, def.tracks.length);
ok(
  'los pasos activos coinciden exactamente',
  recovered?.tracks.every((tr, trIdx) =>
    tr.steps.every((st, stIdx) => st.active === def.tracks[trIdx].steps[stIdx].active),
  ) ?? false,
);

// 5. Forking
const forked = forkBeat(def, 'MC Freestyle');
eq('forkBeat agrega sufijo Remix al nombre', forked.name, `${def.name} (Remix)`);
eq('forkBeat guarda forkedFrom', forked.forkedFrom, def.name);
eq('forkBeat asigna nuevo author', forked.author, 'MC Freestyle');
ok('forkBeat genera id nuevo', forked.id !== def.id);

// 6. Manejo de strings inválidos
eq('parseBeat(null/vacío) retorna null', parseBeat(''), null);
eq('parseBeat(string basura) retorna null', parseBeat('xyz-invalid-123'), null);

// 7. Autenticidad rítmica y tímbrica
const trap = createProjectFromPreset(BEAT_PRESETS.find((p) => p.id === 'trap-808-dark')!);
const trapSnare = trap.tracks.find((t) => t.sound === 'snare')!;
ok('Trap snare está en step 8 (half-time tiempo 3)', trapSnare.steps[8].active);
const trapHats = trap.tracks.find((t) => t.sound === 'hihat')!;
ok('Trap hi-hats tienen rolls (>1)', trapHats.steps.some((s) => s.roll && s.roll > 1));
const trap808 = trap.tracks.find((t) => t.sound === '808')!;
const trap808Pitches = trap808.steps.filter((s) => s.active).map((s) => s.pitch);
ok('Trap 808 tiene variedad melódica de notas', new Set(trap808Pitches).size > 1);

const boombap = createProjectFromPreset(BEAT_PRESETS.find((p) => p.id === 'boombap-90s')!);
const bapSnare = boombap.tracks.find((t) => t.sound === 'snare')!;
ok('BoomBap snare está en tiempos 4 y 12 (2 y 4 full-time)', bapSnare.steps[4].active && bapSnare.steps[12].active);

// 8. Randomize y fillTrackSteps
const filled2 = fillTrackSteps(def.tracks[0], 'every2');
ok('fillTrackSteps every2 activa los pasos pares', filled2.steps.every((s, idx) => s.active === (idx % 2 === 0)));
const cleared = fillTrackSteps(filled2, 'clear');
ok('fillTrackSteps clear desactiva todos los pasos', cleared.steps.every((s) => !s.active));
const rndBeat = randomizeBeat(def, 42);
eq('randomizeBeat conserva las 8 pistas', rndBeat.tracks.length, 8);
ok('randomizeBeat produce un beat serializable válido', parseBeat(serializeBeat(rndBeat)) !== null);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll beatmaker self-tests passed');
