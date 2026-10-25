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

const STYLE_ICONS: Record<SongStyle, string> = {
  adventure: '🗺️', arcade: '👾', dream: '🌙', synthwave: '🌆', cyberpunk: '⚡', rock: '🎸', hiphop: '🥁',
};

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

  const generate = (nextSeed: string, nextStyle: SongStyle = style) => {
    setSeed(nextSeed);
    setStyle(nextStyle);
    const options: GeneratorOptions = { seed: nextSeed, style: nextStyle, root, bars, trackCount: trackCount || undefined, complexity, sound };
    const song = generateSong(options);
    c.resetTo(song);
    setLast({ options, trackIds: song.tracks.map((t) => t.id) });
  };

  const index = last ? last.trackIds.indexOf(c.activeTrackId) : -1;
  const role = last && index >= 0 && c.song.tracks.some((t) => t.id === c.activeTrackId) ? roleAt(last.trackIds.length, index) : undefined;
  const regenerateTrack = () => {
    if (!last || !role) return;
    const options = { ...last.options, partSeeds: { ...last.options.partSeeds, [role]: crypto.randomUUID().slice(0, 8) } };
    c.replaceTrackNotes(c.activeTrackId, generateSong(options).tracks[index].notes);
    setLast({ ...last, options });
  };

  return (
    <div className={styles.generator}>
      <StylePresets active={style} onPick={(s) => generate(crypto.randomUUID().slice(0, 8), s)} />
      <GeneratorFields style={style} setStyle={setStyle} root={root} setRoot={setRoot} isMinor={isMinor}
        bars={bars} setBars={setBars} complexity={complexity} setComplexity={setComplexity}
        sound={sound} setSound={setSound} trackCount={trackCount} setTrackCount={setTrackCount} seed={seed} setSeed={setSeed} />
      <div className={styles.actions}>
        <Button type="primary" onClick={() => generate(crypto.randomUUID().slice(0, 8))}>Generar otra idea</Button>
        <Button onClick={() => generate(seed || 'hios')}>Usar esta semilla</Button>
        <Button disabled={!role} onClick={regenerateTrack}
          title={role ? 'Nueva versión de la pista activa con la misma armonía' : 'Generá una idea y elegí una de sus pistas'}>
          Regenerar solo la pista activa
        </Button>
        <Button onClick={c.varyActiveMelody} title="Crea una variación melódica sobre la pista activa">✨ Mutar melodía</Button>
        <span className={styles.hint}>Tocá un preset rápido arriba o ajustá los parámetros. Podés Deshacer (Ctrl+Z) en cualquier momento.</span>
      </div>
    </div>
  );
}

interface FieldsProps {
  style: SongStyle; setStyle: (v: SongStyle) => void; root: number; setRoot: (v: number) => void; isMinor: boolean;
  bars: number; setBars: (v: number) => void; complexity: Complexity; setComplexity: (v: Complexity) => void;
  sound: 'real' | 'retro'; setSound: (v: 'real' | 'retro') => void; trackCount: number; setTrackCount: (v: number) => void;
  seed: string; setSeed: (v: string) => void;
}

function GeneratorFields(p: FieldsProps) {
  return (
    <div className={styles.fields}>
      <label>Estilo<Select aria-label="Estilo musical" value={p.style} onChange={p.setStyle}
        options={Object.entries(SONG_STYLES).map(([value, item]) => ({ value, label: item.label }))} /></label>
      <label>Tonalidad<Select aria-label="Tonalidad" value={p.root} onChange={p.setRoot}
        options={ROOT_NAMES.map((label, value) => ({ value, label: `${label} ${p.isMinor ? 'menor' : 'mayor'}` }))} /></label>
      <label>Duración<Select aria-label="Duración de la idea" value={p.bars} onChange={p.setBars}
        options={[2, 4, 8, 16].map((value) => ({ value, label: `${value} compases` }))} /></label>
      <label>Complejidad<Select aria-label="Complejidad" value={p.complexity} onChange={p.setComplexity}
        options={Object.entries(COMPLEXITY_LABELS).map(([value, label]) => ({ value, label }))} /></label>
      <label>Sonido<Select aria-label="Tipo de sonido" value={p.sound} onChange={p.setSound} options={SOUND_OPTIONS} /></label>
      <label>Instrumentación<Select aria-label="Cantidad de pistas e instrumentación" value={p.trackCount} onChange={p.setTrackCount} options={TRACK_OPTIONS} /></label>
      <label>Semilla<Input aria-label="Semilla" value={p.seed} maxLength={40} onChange={(e) => p.setSeed(e.target.value)} /></label>
    </div>
  );
}

function StylePresets({ active, onPick }: { active: SongStyle; onPick: (s: SongStyle) => void }) {
  return (
    <div className={styles.styleChips} role="group" aria-label="Presets rápidos por género">
      {(Object.entries(SONG_STYLES) as [SongStyle, (typeof SONG_STYLES)[SongStyle]][]).map(([key, item]) => (
        <button key={key} type="button" className={`${styles.styleChip} ${active === key ? styles.styleChipActive : ''}`}
          aria-pressed={active === key} onClick={() => onPick(key)}>
          <span className={styles.styleChipTitle}>{STYLE_ICONS[key]} {item.label}</span>
          <span className={styles.styleChipMeta}>{item.bpm[0]}–{item.bpm[1]} BPM · {item.mode === 'minor' ? 'Menor' : 'Mayor'}</span>
        </button>
      ))}
    </div>
  );
}
