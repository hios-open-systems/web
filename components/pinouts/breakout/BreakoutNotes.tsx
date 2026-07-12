import type { BreakoutNote } from '@/config/pinouts/modules';
import { RichText } from './RichText';
import styles from './breakout.module.css';

export function BreakoutNotes({ notes }: { notes: BreakoutNote[] }) {
  return (
    <div className={styles.notes}>
      {notes.map((note) => (
        <div key={note.title} className={`${styles.note} ${note.warn ? styles.noteWarn : ''}`}>
          <div className={styles.noteTitle}>
            {note.warn ? '⚠ ' : ''}
            {note.title}
          </div>
          <div className={styles.noteBody}>
            <RichText text={note.body} />
          </div>
        </div>
      ))}
    </div>
  );
}
