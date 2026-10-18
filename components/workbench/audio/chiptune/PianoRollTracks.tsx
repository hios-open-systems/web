import { INSTRUMENTS, type ChiptuneSong, type ChiptuneNote } from '@/lib/workbench/chiptune';
import { PianoRollNote } from './PianoRollNote';
import { pitchToY, tickToX, durToWidth } from './grid';
import styles from './chiptune.module.css';
interface Props {
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
  selectedNoteIds?: string[];
  stepW: number;
  rowH: number;
  showGhostNotes?: boolean;
  onActivateTrack?: (id: string) => void;
  onSelectNote: (id: string) => void;
  onChangeNote: (id: string, patch: Partial<ChiptuneNote>) => void;
  onDeleteNote: (id: string) => void;
}
export function PianoRollTracks({
  song,
  activeTrackId,
  selectedNoteId,
  selectedNoteIds = [],
  stepW,
  rowH,
  showGhostNotes = false,
  onActivateTrack,
  onSelectNote,
  onChangeNote,
  onDeleteNote,
}: Props) {
  return (
    <>
      {song.tracks.map((track) => {
        const color = INSTRUMENTS[track.instrument].color;
        const active = track.id === activeTrackId;
        if (!active && !showGhostNotes) return null;
        return track.notes.map((note) =>
          active ? (
            <PianoRollNote
              key={note.id}
              note={note}
              color={color}
              selected={selectedNoteId === note.id || selectedNoteIds.includes(note.id)}
              stepW={stepW}
              rowH={rowH}
              onSelect={onSelectNote}
              onChange={onChangeNote}
              onDelete={onDeleteNote}
            />
          ) : (
            <button
              key={note.id}
              type="button"
              className={styles.noteGhost}
              onClick={() => onActivateTrack?.(track.id)}
              title={`${track.name} (${INSTRUMENTS[track.instrument].label}) — clic para cambiar a esta pista`}
              aria-label={`Nota de pista ${track.name}`}
              style={{
                left: tickToX(note.start, stepW),
                top: pitchToY(note.pitch, rowH),
                width: Math.max(stepW - 2, durToWidth(note.duration, stepW) - 2),
                height: rowH - 2,
                borderColor: color,
                background: `color-mix(in srgb, ${color} 26%, transparent)`,
              }}
            />
          ),
        );
      })}
    </>
  );
}
