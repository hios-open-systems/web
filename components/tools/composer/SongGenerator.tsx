'use client';
import { useState } from 'react';
import { Button, Input, Select } from 'antd';
import {
  generateSong,
  roleAt,
  COMPLEXITY_LABELS,
  SONG_STYLES,
  type Complexity,
  type GeneratorOptions,
  type SongStyle,
} from '@/lib/workbench/chiptuneGenerator';
import { ROOT_NAMES } from '@/lib/workbench/chiptuneMusic';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

const TRACK_OPTIONS = [
  { value: 0, label: 'Auto (4 pistas)' },
  { value: 3, label: '3 pistas: Melodía, Bajo, Batería' },
  { value: 4, label: '4 pistas: + Arpegio' },
  { value: 5, label: '5 pistas: + Pad / Strings' },
  { value: 6, label: '6 pistas: Ensamble completo (+ Coro)' },
];

/** Última generación: permite regenerar una sola pista sin tocar la armonía ni las demás. */
interface LastGeneration {
  options: GeneratorOptions;
  trackIds: string[];
}

const SOUND_OPTIONS = [
  { value: 'real', label: 'Real (samples)' },
  { value: 'retro', label: 'Retro (synth)' },
];

export function SongGenerator({ c }: { c: ComposerState }) {
  const [style, setStyle] = useState<SongStyle>('adventure');
  const [root, setRoot] = useState(0);
  const [bars, setBars] = useState(8);
  const [trackCount, setTrackCount] = useState(0);
  const [complexity, setComplexity] = useState<Complexity>('normal');
  const [sound, setSound] = useState<'real' | 'retro'>('real');
  const [seed, setSeed] = useState('hios');
  const [last, setLast] = useState<LastGeneration | null>(null);
  const isMinor = SONG_STYLES[style].mode === 'minor';

  const generate = (nextSeed: string) => {
    setSeed(nextSeed);
    const options: GeneratorOptions = { seed: nextSeed, style, root, bars, trackCount: trackCount || undefined, complexity, sound };
    const song = generateSong(options);
    c.resetTo(song);
    setLast({ options, trackIds: song.tracks.map((t) => t.id) });
  };

  // La pista activa sigue siendo la que generamos (mismo id) -> se puede regenerar sola.
  const index = last ? last.trackIds.indexOf(c.activeTrackId) : -1;
  const role = last && index >= 0 && c.song.tracks.some((t) => t.id === c.activeTrackId)
    ? roleAt(last.trackIds.length, index)
    : undefined;
  const regenerateTrack = () => {
    if (!last || !role) return;
    const partSeeds = { ...last.options.partSeeds, [role]: crypto.randomUUID().slice(0, 8) };
    const options = { ...last.options, partSeeds };
    const fresh = generateSong(options);
    c.replaceTrackNotes(c.activeTrackId, fresh.tracks[index].notes);
    setLast({ ...last, options });
  };

  return (
    <div className={styles.generator}>
      <p>
        Cada idea arma secciones (intro, verso, estribillo, puente), elige progresiones, motivos melódicos, groove y
        bajo según el género. Con sonido Real, cada estilo usa instrumentos sampleados (piano, guitarras, cuerdas, batería
        acústica); Retro deja todo en synth chiptune.
      </p>
      <div className={styles.fields}>
        <label>
          Estilo
          <Select
            aria-label="Estilo musical"
            value={style}
            onChange={setStyle}
            options={Object.entries(SONG_STYLES).map(([value, item]) => ({ value, label: item.label }))}
          />
        </label>
        <label>
          Tonalidad
          <Select
            aria-label="Tonalidad"
            value={root}
            onChange={setRoot}
            options={ROOT_NAMES.map((label, value) => ({ value, label: `${label} ${isMinor ? 'menor' : 'mayor'}` }))}
          />
        </label>
        <label>
          Duración
          <Select
            aria-label="Duración de la idea"
            value={bars}
            onChange={setBars}
            options={[2, 4, 8, 16].map((value) => ({ value, label: `${value} compases` }))}
          />
        </label>
        <label>
          Complejidad
          <Select
            aria-label="Complejidad"
            value={complexity}
            onChange={setComplexity}
            options={Object.entries(COMPLEXITY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </label>
        <label>
          Sonido
          <Select aria-label="Tipo de sonido" value={sound} onChange={setSound} options={SOUND_OPTIONS} />
        </label>
        <label>
          Instrumentación
          <Select aria-label="Cantidad de pistas e instrumentación" value={trackCount} onChange={setTrackCount} options={TRACK_OPTIONS} />
        </label>
        <label>
          Semilla
          <Input aria-label="Semilla" value={seed} maxLength={40} onChange={(e) => setSeed(e.target.value)} />
        </label>
      </div>
      <div className={styles.actions}>
        <Button type="primary" onClick={() => generate(crypto.randomUUID().slice(0, 8))}>
          Generar otra idea
        </Button>
        <Button onClick={() => generate(seed || 'hios')}>Usar esta semilla</Button>
        <Button
          disabled={!role}
          onClick={regenerateTrack}
          title={role ? 'Nueva versión de la pista activa con la misma armonía' : 'Generá una idea y elegí una de sus pistas'}
        >
          Regenerar solo la pista activa
        </Button>
        <span className={styles.hint}>
          Misma semilla y ajustes → misma música. Se reemplaza la canción actual. Podés Deshacer en cualquier momento.
        </span>
      </div>
    </div>
  );
}
