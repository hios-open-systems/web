import type { ChiptuneNote, ChiptuneSong, LoopRegion } from '@/lib/workbench/chiptune';
import type { LaneKind } from './NoteLane';
import type { MusicalScale } from '@/lib/workbench/chiptuneMusic';

export interface PianoRollProps {
  scale?: MusicalScale;
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
  /** Notas seleccionadas (rango o nota tocada): se resaltan y son las que edita el carril. */
  selectedNoteIds?: string[];
  /** Carril de automatización visible bajo el roll (ninguno si se omite). */
  lane?: LaneKind;
  /** Si el Loop está activo, la región se sombrea sobre la grilla. */
  loopActive?: boolean;
  selectedRange?: { startTick: number; endTick: number } | null;
  zoom?: number;
  drawDuration?: number;
  mode?: 'draw' | 'select';
  showGhostNotes?: boolean;
  onActivateTrack?: (id: string) => void;
  onRange?: (range: { startTick: number; endTick: number } | null) => void;
  onSelectNote: (id: string | null) => void;
  onChangeNote: (id: string, patch: Partial<ChiptuneNote>) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: ChiptuneNote) => void;
  onSeek?: (tick: number) => void;
  onLoopRegion?: (region: LoopRegion | null) => void;
  onChangeNotes?: (ids: string[], patch: Partial<ChiptuneNote>) => void;
  getPlayheadTicks: () => number | null;
  isPlaying: boolean;
}
