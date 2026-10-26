'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getBreakout } from '@/config/pinouts/modules';
import { assemblyModules, moduleSections, moduleWires } from '@/lib/padWiring/assembly';
import { readRaw, writeRaw } from '@/lib/storage/safeLocalStorage';
import { useWiringGuide } from '../WiringGuideContext';
import { RichText } from '../RichText';
import { HeaderMap } from './HeaderMap';
import { WireList } from './WireList';
import { SolderJointGuide } from './SolderJointGuide';
import { useAssemblyProgress } from './useAssemblyProgress';
import styles from './assembly.module.css';

/** One module at a time: its joints on the real header, a tick per joint, and the module's own warnings. */
export function SolderingMode({ embedded = false }: { embedded?: boolean }) {
  const guide = useWiringGuide();
  const t = useTranslations('Assembly');
  const board = guide.meta.boardId ? getBreakout(guide.meta.boardId)?.board : undefined;
  const modules = assemblyModules(guide);
  const progress = useAssemblyProgress(guide);
  const lastKey = `hios:solder:last:${guide.meta.id}`;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    const saved = Number(readRaw(lastKey));
    if (Number.isInteger(saved) && saved > 0 && saved < modules.length) setIndex(saved);
  }, [lastKey, modules.length]);

  const current = modules[index];
  const wires = useMemo(() => moduleWires(guide, current.id, board), [guide, current.id, board]);
  const taken = useMemo(() => new Set(guide.pins.filter(pin => pin.mod !== current.id).map(pin => `IO${pin.gpio}`)), [guide, current.id]);
  const notes = moduleSections(guide, current.id).filter(section => section.ascii || section.tip);
  const doneIn = (id: string) => moduleWires(guide, id).filter(wire => progress.done.includes(wire.id)).length;
  const go = (next: number) => { setIndex(next); setSelected(''); writeRaw(lastKey, String(next)); };

  return <section className={styles.mode} data-soldering-mode aria-label={t('title')}>
    <header className={styles.modeHead}>
      <span className={styles.eyebrow}>{guide.meta.title} · {guide.meta.mcu}</span>
      {embedded ? null : <><h2>{t('title')}</h2><p>{t('intro')}</p></>}
      <p className={styles.notice}>{t('unpowered')}</p>
    </header>

    <nav className={styles.stepper} aria-label={t('modules')}>
      {modules.map((item, i) => {
        const total = moduleWires(guide, item.id).length;
        const count = doneIn(item.id);
        return <button key={item.id} type="button" aria-current={i === index ? 'step' : undefined}
          className={count === total && total > 0 ? styles.stepDone : undefined} onClick={() => go(i)}>
          <span className={styles.stepNum}>{count === total && total > 0 ? '✓' : i + 1}</span>
          <span className={styles.stepName}>{item.icon} {item.name}</span>
          <span className={styles.stepCount}>{count}/{total}</span>
        </button>;
      })}
    </nav>

    <article className={styles.module} data-module={current.id}>
      <header className={styles.moduleHead}>
        <span className={styles.stepOf}>{t('stepOf', { current: index + 1, total: modules.length })}</span>
        <h3>{current.icon} {current.name}</h3>
        <p className={styles.power}><strong>{t('power')}:</strong> <RichText text={current.power} /></p>
        {current.load ? <p className={styles.power}><RichText text={current.load} /></p> : null}
      </header>
      {current.tip ? <p className={styles.tip}><RichText text={current.tip} /></p> : null}

      <div className={board ? styles.split : undefined}>
        {board ? <HeaderMap board={board} wires={wires} taken={taken} done={progress.done}
          selected={selected} onSelect={setSelected} /> : null}
        <WireList wires={wires} done={progress.done} ready={progress.ready} selected={selected}
          onSelect={setSelected} onToggle={progress.toggle} />
      </div>

      {notes.length > 0 ? <details className={styles.more}>
        <summary>{t('moduleNotes')}</summary>
        {notes.map(section => <div key={section.t}>
          <h4>{section.t}</h4>
          {section.ascii ? <pre className={styles.ascii}>{section.ascii}</pre> : null}
          {section.tip ? <p><RichText text={section.tip} /></p> : null}
        </div>)}
      </details> : null}
      <details className={styles.more}>
        <summary>{t('jointTitle')}</summary>
        <SolderJointGuide />
      </details>
    </article>

    <footer className={styles.footer}>
      <button type="button" disabled={index === 0} onClick={() => go(index - 1)}>← {t('previous')}</button>
      <span role="status">{t('progress', { done: doneIn(current.id), total: wires.length })}</span>
      <button type="button" disabled={index === modules.length - 1} onClick={() => go(index + 1)}>{t('next')} →</button>
    </footer>
    <p className={styles.muted}>{t('progressHint')}</p>
    {progress.saveFailed ? <p role="alert" className={styles.alert}>{t('saveFailed')}</p> : null}
  </section>;
}
