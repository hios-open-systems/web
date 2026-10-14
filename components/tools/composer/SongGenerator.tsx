'use client';
import { useState } from 'react';
import { Button, Input, Select } from 'antd';
import { generateSong, SONG_STYLES, type SongStyle } from '@/lib/workbench/chiptuneGenerator';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

export function SongGenerator({ c }: { c: ComposerState }) {
  const [style, setStyle] = useState<SongStyle>('adventure');
  const [root, setRoot] = useState(0);
  const [bars, setBars] = useState(4);
  const [seed, setSeed] = useState('hios');
  const generate = (nextSeed: string) => {
    setSeed(nextSeed);
    c.resetTo(generateSong({ seed: nextSeed, style, root, bars }));
  };
  return (
    <div className={styles.generator}>
      <p>
        Una idea con melodía, bajo, arpegio y percusión. Podés editar cada pista o recuperar la anterior con
        Deshacer.
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
            options={['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'].map(
              (label, value) => ({ value, label: `${label} ${style === 'arcade' ? 'menor' : 'mayor'}` }),
            )}
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
          Misma semilla y ajustes → misma música. Se reemplaza la canción actual.
        </span>
      </div>
    </div>
  );
}
