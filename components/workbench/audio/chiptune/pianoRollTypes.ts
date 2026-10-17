import type { ChiptuneNote, ChiptuneSong } from '@/lib/workbench/chiptune';
import type { MusicalScale } from '@/lib/workbench/chiptuneMusic';

export interface PianoRollProps {
  scale?: MusicalScale;
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
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
  getPlayheadTicks: () => number | null;
  isPlaying: boolean;
}
