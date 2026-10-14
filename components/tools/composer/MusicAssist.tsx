'use client';
import { Button, Checkbox, Select } from 'antd';
import { canTranspose, DEFAULT_SCALE, ROOT_NAMES, SCALE_INTERVALS } from '@/lib/workbench/chiptuneMusic';
import type { ComposerState } from './useComposerState';
import styles from './composer.module.css';

interface Props {
  c: ComposerState;
  showScale: boolean;
  snap: boolean;
  onShowScale: (value: boolean) => void;
  onSnap: (value: boolean) => void;
}
export function MusicAssist({ c, showScale, snap, onShowScale, onSnap }: Props) {
  const scale = c.song.scale ?? DEFAULT_SCALE;
  const track = c.song.tracks.find((t) => t.id === c.activeTrackId);
  const percussion = track?.instrument === 'noise-perc';
  return (
    <details className={styles.details}>
      <summary>
        Escala y melodía · {ROOT_NAMES[scale.root]} {scale.mode === 'major' ? 'mayor' : 'menor'}
      </summary>
      <div className={styles.generator}>
        <div className={styles.fields}>
          <label>
            Nota base
            <Select
              aria-label="Nota base de la escala"
              value={scale.root}
              onChange={(root) => c.setScale({ ...scale, root })}
              options={ROOT_NAMES.map((label, value) => ({ label, value }))}
            />
          </label>
          <label>
            Escala guía
            <Select
              aria-label="Escala guía"
              value={scale.mode}
              onChange={(mode) => c.setScale({ ...scale, mode })}
              options={[
                { value: 'major', label: 'Mayor' },
                { value: 'minor', label: 'Menor natural' },
              ]}
            />
          </label>
        </div>
        <p className={styles.hint}>
          {SCALE_INTERVALS[scale.mode].map((n) => ROOT_NAMES[(n + scale.root) % 12]).join(' · ')}. La guía no
          cambia las notas existentes. La nota base se marca con ●.
        </p>
        <div className={styles.assistOptions}>
          <Checkbox checked={showScale} disabled={percussion} onChange={(e) => onShowScale(e.target.checked)}>
            Ver escala en el piano
          </Checkbox>
          <Checkbox checked={snap} disabled={percussion} onChange={(e) => onSnap(e.target.checked)}>
            Ajustar al dibujar y mover
          </Checkbox>
        </div>
        <p className={styles.hint}>
          {percussion
            ? 'La percusión usa alturas para elegir golpes; estas acciones se aplican a pistas melódicas.'
            : `Solo se modifica «${track?.name ?? ''}». Las otras pistas y el ritmo se conservan. Podés deshacer cada cambio.`}
        </p>
        <Button
          style={{ minHeight: 44 }}
          onClick={c.varyActiveMelody}
          disabled={percussion || !track?.notes.length}
        >
          Variar melodía
        </Button>
        <div className={styles.transpose} role="group" aria-label="Transponer pista activa">
          {[-12, -1, 1, 12].map((steps) => (
            <Button
              key={steps}
              disabled={!canTranspose(track, steps)}
              onClick={() => c.transpose(steps)}
              aria-label={`${steps < 0 ? 'Bajar' : 'Subir'} ${Math.abs(steps) === 12 ? 'una octava' : 'un semitono'}`}
            >
              {steps < 0 ? '−' : '+'}
              {Math.abs(steps) === 12 ? '8va' : '1 semitono'}
            </Button>
          ))}
        </div>
        <span className={styles.hint}>
          Transponer desplaza toda la pista, incluso con el ajuste a escala activado.
        </span>
      </div>
    </details>
  );
}
