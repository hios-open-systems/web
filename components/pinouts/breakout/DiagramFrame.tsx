'use client';

import { useState, type ReactNode } from 'react';
import { Button } from 'antd';
import { useLocale } from 'next-intl';
import styles from './diagram-frame.module.css';

const LABELS: Record<string, { fit: string; detail: string; hint: string }> = {
  es: { fit: 'Ajustar', detail: 'Ampliar', hint: 'Deslizá para ver el diagrama completo.' },
  en: { fit: 'Fit', detail: 'Enlarge', hint: 'Scroll to view the full diagram.' },
  de: { fit: 'Einpassen', detail: 'Vergrößern', hint: 'Scrollen, um das gesamte Diagramm zu sehen.' },
  it: { fit: 'Adatta', detail: 'Ingrandisci', hint: 'Scorri per vedere il diagramma completo.' },
};

export function DiagramFrame({ children, name }: { children: ReactNode; name: string }) {
  const [expanded, setExpanded] = useState(false);
  const labels = LABELS[useLocale()] ?? LABELS.en;
  return (
    <section className={styles.frame} aria-label={name}>
      <div className={styles.toolbar}>
        <Button size="small" aria-pressed={!expanded} onClick={() => setExpanded(false)}>{labels.fit}</Button>
        <Button size="small" aria-pressed={expanded} onClick={() => setExpanded(true)}>{labels.detail}</Button>
      </div>
      {expanded ? <p className={styles.hint}>{labels.hint}</p> : null}
      <div className={`${styles.viewport} ${expanded ? styles.expanded : ''}`} role="region" aria-label={name} tabIndex={expanded ? 0 : undefined}>
        {children}
      </div>
    </section>
  );
}
