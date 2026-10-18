/**
 * Self-test de los sonidos sampleados: que cada archivo del catálogo exista en
 * public/samples, el mapeo de batería GM, la validación del campo `sound`, el
 * programa MIDI exportado/importado y la asignación por estilo del generador.
 *
 * Run: node --experimental-strip-types scripts/samples-selftest.ts
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  drumSampleFor,
  nearestRoot,
  SAMPLED_SOUND_IDS,
  SAMPLED_SOUNDS,
  sampleUrl,
  soundFiles,
  soundsFor,
} from '../lib/workbench/sampledSounds.ts';
import { createSong, createTrack, createNote } from '../lib/workbench/chiptune.ts';
import { isValidSong } from '../lib/workbench/chiptuneValidation.ts';
import { encodeMidi } from '../lib/workbench/chiptuneMidi.ts';
import { decodeMidi } from '../lib/workbench/chiptuneMidiImport.ts';
import { generateSong, SONG_STYLES, type SongStyle } from '../lib/workbench/chiptuneGenerator.ts';

let failures = 0;
function ok(name: string, pass: boolean, detail = '') {
  if (!pass) {
    failures++;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Archivos: todos presentes y no vacíos (un 404 en producción = nota muda → synth).
for (const id of SAMPLED_SOUND_IDS) {
  const missing = soundFiles(id).filter((file) => {
    const path = join('public', sampleUrl(id, file));
    return !existsSync(path) || statSync(path).size < 1000;
  });
  ok(`${id}: ${soundFiles(id).length} archivos presentes`, missing.length === 0, missing.join(', '));
}
ok('existe public/samples/CREDITS.md (CC BY exige atribución)', existsSync('public/samples/CREDITS.md'));

// Transposición: nunca más de 2 semitonos dentro del rango sampleado.
for (const id of SAMPLED_SOUND_IDS.filter((s) => !SAMPLED_SOUNDS[s].drums)) {
  const { roots } = SAMPLED_SOUNDS[id];
  let worst = 0;
  for (let p = roots[0]; p <= roots[roots.length - 1]; p++) worst = Math.max(worst, Math.abs(nearestRoot(roots, p) - p));
  ok(`${id}: transposición máxima ≤ 2 semitonos`, worst <= 2, `${worst}`);
}

// Batería GM.
const drum = (pitch: number) => drumSampleFor(pitch)?.file ?? null;
ok('36 → bombo', drum(36) === 'kick');
ok('38 → caja', drum(38) === 'snare');
ok('39 (clap) → sin sample: lo hace el synth', drum(39) === null);
ok('42 → hi-hat cerrado', drum(42) === 'hat');
ok('46 → hi-hat abierto', drum(46) === 'open');
ok('47/45/43 → toms afinados distinto', drum(47) === 'tomhi' && drum(43) === 'tomlo' && drumSampleFor(45)!.rate !== drumSampleFor(43)!.rate);
ok('49 → crash, 51 → ride', drum(49) === 'crash' && drum(51) === 'ride');

// Validación del campo sound.
const song = createSong();
song.tracks = [createTrack('Piano', 'pulse-lead', [createNote(60, 0, 480)])];
song.tracks[0].sound = 'piano';
ok('canción con sound válido pasa la validación', isValidSong(JSON.parse(JSON.stringify(song))));
ok('sound desconocido no pasa', !isValidSong({ ...song, tracks: [{ ...song.tracks[0], sound: 'kazoo' }] }));

// MIDI: el programa sale del sonido y vuelve al importar.
song.tracks[0].sound = 'strings';
const hex = Array.from(encodeMidi(song), (b) => b.toString(16).padStart(2, '0')).join('');
ok('export .mid usa el programa GM del sonido (48 cuerdas)', hex.includes('00c030'));
ok('import .mid recupera el sonido por programa', decodeMidi(encodeMidi(song)).tracks[0].sound === 'strings');

// Generador.
const styles = Object.keys(SONG_STYLES) as SongStyle[];
for (const style of styles) {
  const real = generateSong({ seed: 'samples', style, root: 0, bars: 4, trackCount: 6 });
  const fit = real.tracks.every((t) => !t.sound || soundsFor(t.instrument === 'noise-perc').includes(t.sound));
  ok(`${style}: cada sonido encaja con su instrumento`, fit);
  ok(`${style}: canción con sonidos reales es válida`, isValidSong(real));
  const retro = generateSong({ seed: 'samples', style, root: 0, bars: 4, trackCount: 6, sound: 'retro' });
  ok(`${style}: modo retro no usa samples`, retro.tracks.every((t) => !t.sound));
}
const rock = generateSong({ seed: 'samples', style: 'rock', root: 0, bars: 4 });
ok('rock real: guitarra distorsionada y batería acústica', rock.tracks.some((t) => t.sound === 'drive-guitar') && rock.tracks.some((t) => t.sound === 'acoustic-kit'));
ok('arcade sigue siendo chiptune', generateSong({ seed: 'samples', style: 'arcade', root: 0, bars: 4 }).tracks.every((t) => !t.sound));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll sample self-tests passed');
