'use client';

import { useEffect, useState } from 'react';
import {
  EMPTY_CHECKLIST,
  isDone,
  readChecklist,
  toggle,
  writeChecklist,
} from '@/lib/padWiring/checklist';
import { useWiringGuide } from '../WiringGuideContext';
import styles from '../wiring-guide.module.css';

export function ChecklistView() {
  const guide = useWiringGuide();
  const id = guide.meta.id;
  const [state, setState] = useState(EMPTY_CHECKLIST);

  useEffect(() => {
    setState(readChecklist(id));
  }, [id]);

  const update = (index: number) => {
    setState((prev) => {
      const next = toggle(prev, index);
      writeChecklist(id, next);
      return next;
    });
  };

  const doneCount = state.done.filter((index) => index < guide.check.length).length;

  return (
    <section className={styles.checklist}>
      <div className={styles.checkProgress}>
        {doneCount} / {guide.check.length}
      </div>
      {guide.check.map((item, index) => {
        const checked = isDone(state, index);
        return (
          <label key={index} className={`${styles.checkItem} ${checked ? styles.checkDone : ''}`}>
            <input type="checkbox" checked={checked} onChange={() => update(index)} />
            <span className={styles.checkText}>{item}</span>
          </label>
        );
      })}
    </section>
  );
}
