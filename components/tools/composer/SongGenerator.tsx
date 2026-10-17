'use client';
import { useState } from 'react';
import { Button, Input, Select } from 'antd';
import { generateSong, SONG_STYLES, type SongStyle } from '@/lib/workbench/chiptuneGenerator';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

const ROOT_LABELS = ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];

export function SongGenerator({ c }: { c: ComposerState }) {
  const [style, setStyle] = useState<SongStyle>('adventure');
  const [root, setRoot] = useState(0);
  const [bars, setBars] = useState(4);
  const [trackCount, setTrackCount] = useState(0);
  const [seed, setSeed] = useState('hios');
  const isMinor = style === 'arcade' || style === 'synthwave' || style === 'cyberpunk' || style === 'hiphop';

  const generate = (nextSeed: string) => {
    setSeed(nextSeed);
    c.resetTo(generateSong({ seed: nextSeed, style, root, bars, trackCount: trackCount || undefined }));
  };

  return (
    <div className={styles.generator}>
      <p>
        Generador procedural retro y synth: compone guitarra/melodía, bajo, batería, arpegios, strings y coros
        de forma 100% matemática y reproducible en tu navegador.
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
            options={ROOT_LABELS.map((label, value) => ({
              value,
              label: `${label} ${isMinor ? 'menor' : 'mayor'}`,
            }))}
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
          Instrumentación
          <Select
            aria-label="Cantidad de pistas e instrumentación"
            value={trackCount}
            onChange={setTrackCount}
            options={[
              { value: 0, label: 'Auto (3 a 6 pistas)' },
              { value: 3, label: '3 pistas: Guitarra, Bajo, Batería' },
              { value: 4, label: '4 pistas: + Arpegio' },
              { value: 5, label: '5 pistas: + Strings / Pad' },
              { value: 6, label: '6 pistas: Ensamble completo (+ Coro)' },
            ]}
          />
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
        <span className={styles.hint}>
          Misma semilla y ajustes → misma música. Se reemplaza la canción actual. Podés Deshacer en cualquier momento.
        </span>
      </div>
    </div>
  );
}
