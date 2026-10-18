/**
 * Self-test del generador de canciones: determinismo, variedad real entre
 * semillas, validez del formato, notas en tonalidad y dentro de la canción, y
 * que regenerar una pista (partSeeds) no toque la armonía ni las demás.
 *
 * Run: node --experimental-strip-types scripts/generator-selftest.ts
 */
import { generateSong, SONG_STYLES, trackRoles, type SongStyle } from '../lib/workbench/chiptuneGenerator.ts';
import { isValidSong } from '../lib/workbench/chiptuneValidation.ts';
import { inScale } from '../lib/workbench/chiptuneMusic.ts';
import { planSections, seededRandom, voiceChord } from '../lib/workbench/generatorTheory.ts';
import type { ChiptuneSong } from '../lib/workbench/chiptune.ts';

let failures = 0;
function ok(name: string, pass: boolean, detail = '') {
  if (!pass) {
    failures++;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const music = (s: ChiptuneSong) => JSON.stringify(s.tracks.map((t) => t.notes.map(({ id: _id, ...n }) => n)));
const bassRoots = (s: ChiptuneSong) =>
  s.tracks[1].notes.filter((n) => n.start % 1920 === 0).map((n) => n.pitch % 12).join(',');
const styles = Object.keys(SONG_STYLES) as SongStyle[];

for (const style of styles) {
  const base = { seed: 'selftest', style, root: 4, bars: 8 };
  ok(`${style}: misma semilla, misma música`, music(generateSong(base)) === music(generateSong(base)));
  const progressions = new Set<string>();
  let problems = 0;
  for (let i = 0; i < 12; i++) {
    for (const trackCount of [3, 4, 6]) {
      const song = generateSong({ ...base, seed: `v${i}`, root: i % 12, trackCount });
      if (!isValidSong(JSON.parse(JSON.stringify(song)))) problems++;
      for (const track of song.tracks)
        for (const n of track.notes) {
          if (n.start < 0 || n.start + n.duration > song.lengthBars * 1920) problems++;
          if (track.instrument !== 'noise-perc' && track.name !== 'Bajo' && !inScale(n.pitch, song.scale!)) problems++;
        }
      if (trackCount === 4 && i % 12 === 4) progressions.add(bassRoots(song));
    }
    progressions.add(bassRoots(generateSong({ ...base, seed: `v${i}` })));
  }
  ok(`${style}: canciones válidas, en tonalidad y dentro de la canción`, problems === 0, `${problems} problemas`);
  ok(`${style}: la semilla cambia la progresión (≥6 distintas en 12)`, progressions.size >= 6, `${progressions.size}`);
}

// Cambiar la tonalidad transpone la misma idea (la semilla no depende de la tónica).
const inC = generateSong({ seed: 'key', style: 'adventure', root: 0, bars: 4 });
const inD = generateSong({ seed: 'key', style: 'adventure', root: 2, bars: 4 });
ok('la tonalidad transpone la misma melodía', inC.tracks[0].notes.every((n, i) => inD.tracks[0].notes[i].pitch - n.pitch === 2));

// Regenerar una pista: la armonía (bajo) y las demás quedan iguales; la elegida cambia.
const original = generateSong({ seed: 'part', style: 'synthwave', root: 9, bars: 8, trackCount: 6 });
const relead = generateSong({ seed: 'part', style: 'synthwave', root: 9, bars: 8, trackCount: 6, partSeeds: { lead: 'otra' } });
const roles = trackRoles(6);
ok('partSeeds cambia solo la pista elegida', JSON.stringify(roles.map((r, i) => r === 'lead' || music({ ...original, tracks: [original.tracks[i]] }) === music({ ...relead, tracks: [relead.tracks[i]] }))) === JSON.stringify(roles.map(() => true)));
ok('partSeeds sí cambia la melodía', music({ ...original, tracks: [original.tracks[0]] }) !== music({ ...relead, tracks: [relead.tracks[0]] }));
ok('partSeeds mantiene tempo', original.bpm === relead.bpm);

// Forma: cubre todos los compases sin huecos.
for (const bars of [1, 2, 4, 8, 16]) {
  const sections = planSections(bars, seededRandom(`f${bars}`));
  const covered = sections.reduce((sum, s) => sum + s.bars, 0);
  ok(`forma de ${bars} compases cubre la canción`, covered === bars && sections[0].startBar === 0);
}

// Voicing: notas del acorde, cerradas y moviéndose poco.
const c = voiceChord({ root: 0, mode: 'major' }, 0, false, 60);
const f = voiceChord({ root: 0, mode: 'major' }, 3, false, 60, c);
ok('voicing de Do mayor tiene Do-Mi-Sol', JSON.stringify(c.map((p) => p % 12).sort((a, b) => a - b)) === '[0,4,7]');
ok('conducción de voces: Do→Fa mueve ≤ 4 semitonos en total', f.reduce((s, p, i) => s + Math.abs(p - c[i]), 0) <= 4);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll generator self-tests passed');
