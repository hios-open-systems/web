import { INSTRUMENTS, type ChiptuneSong, type ChiptuneNote } from '@/lib/workbench/chiptune';
import { PianoRollNote } from './PianoRollNote';
import { pitchToY, tickToX, durToWidth } from './grid';
import styles from './chiptune.module.css';
interface Props {
  song: ChiptuneSong;
  activeTrackId: string;
  selectedNoteId: string | null;
  stepW: number;
  rowH: number;
  onSelectNote: (id: string) => void;
  onChangeNote: (id: string, patch: Partial<ChiptuneNote>) => void;
  onDeleteNote: (id: string) => void;
}
export function PianoRollTracks({
  song,
  activeTrackId,
  selectedNoteId,
  stepW,
  rowH,
  onSelectNote,
  onChangeNote,
  onDeleteNote,
}: Props) {
  return (
    <>
      {' '}
      {song.tracks.map((track) => {
        const color = INSTRUMENTS[track.instrument].color;
        const active = track.id === activeTrackId;
        return track.notes.map((note) =>
          active ? (
            <PianoRollNote
              key={note.id}
              note={note}
              color={color}
              selected={selectedNoteId === note.id}
              stepW={stepW}
              rowH={rowH}
              onSelect={onSelectNote}
              onChange={onChangeNote}
              onDelete={onDeleteNote}
            />
          ) : (
            <div
              key={note.id}
              className={styles.noteGhost}
              style={{
                left: tickToX(note.start, stepW),
                top: pitchToY(note.pitch, rowH),
                width: Math.max(stepW - 2, durToWidth(note.duration, stepW) - 2),
                height: rowH - 2,
                background: color,
              }}
            />
          ),
        );
      })}
    </>
  );
}
