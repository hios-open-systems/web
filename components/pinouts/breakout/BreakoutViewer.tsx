'use client';

import { useTranslations } from 'next-intl';
import type { Breakout, BreakoutTable } from '@/config/pinouts/modules';
import { BreakoutHeader } from './BreakoutHeader';
import { BoardDiagram } from './BoardDiagram';
import { BreakoutChipSvg } from './BreakoutChipSvg';
import { AudioConnectorDiagram } from './AudioConnectorDiagram';
import { BoardPinTable } from './BoardPinTable';
import { DiagramFrame } from './DiagramFrame';
import { BreakoutPinList } from './BreakoutPinList';
import { BreakoutTables } from './BreakoutTables';
import { BreakoutNotes } from './BreakoutNotes';
import styles from './breakout.module.css';

export function BreakoutViewer({ breakout }: { breakout: Breakout }) {
  const t = useTranslations('Pinouts');
  const tables: { title: string; table: BreakoutTable }[] = [];
  if (breakout.gain) tables.push({ title: t('tables.gain'), table: breakout.gain });
  if (breakout.channel) tables.push({ title: t('tables.channel'), table: breakout.channel });
  if (breakout.jumpers) tables.push({ title: t('tables.jumpers'), table: breakout.jumpers });

  return (
    <div className={styles.viewer}>
      <BreakoutHeader breakout={breakout} />

      <DiagramFrame name={breakout.name} key={breakout.id}>
      {breakout.board ? (
        <BoardDiagram board={breakout.board} name={breakout.name} />
      ) : breakout.kind === 'connector' ? (
        <AudioConnectorDiagram breakout={breakout} />
      ) : (
        <BreakoutChipSvg breakout={breakout} />
      )}
      </DiagramFrame>
      <BreakoutPinList breakout={breakout} />
      {breakout.board ? <BoardPinTable board={breakout.board} /> : null}
      {tables.length > 0 ? <BreakoutTables tables={tables} /> : null}
      {breakout.notes && breakout.notes.length > 0 ? <BreakoutNotes notes={breakout.notes} /> : null}
    </div>
  );
}
