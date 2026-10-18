'use client';
import { Button, Tooltip } from 'antd';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';
import type { ComposerState } from '@/components/tools/composer/useComposerState';

const barLabel = (tick: number, ticksPerBar: number) => +(tick / ticksPerBar + 1).toFixed(2);

/** Deshacer/rehacer y la región de loop, junto al Play para no ir a buscarlos. */
export function TransportExtras({ c }: { c: ComposerState }) {
  const region = c.song.loopRegion;
  const ticksPerBar = c.song.beatsPerBar * c.song.ppq;
  return (
    <>
      <Tooltip title="Deshacer (Ctrl+Z)">
        <Button aria-label="Deshacer" icon={<UndoOutlined aria-hidden="true" />} disabled={!c.canUndo} onClick={c.undo} />
      </Tooltip>
      <Tooltip title="Rehacer (Ctrl+Shift+Z)">
        <Button aria-label="Rehacer" icon={<RedoOutlined aria-hidden="true" />} disabled={!c.canRedo} onClick={c.redo} />
      </Tooltip>
      {region ? (
        <Button onClick={() => c.setLoopRegion(null)} title="Vuelve a repetir la canción entera">
          Región {barLabel(region.start, ticksPerBar)}–{barLabel(region.end, ticksPerBar)} ✕
        </Button>
      ) : (
        <span style={{ fontSize: 12, opacity: 0.7 }}>Arrastrá sobre la regla de compases para marcar un loop.</span>
      )}
    </>
  );
}
