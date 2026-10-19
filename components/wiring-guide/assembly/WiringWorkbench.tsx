'use client';

import { useState } from 'react';
import { Button, Segmented } from 'antd';
import { useTranslations } from 'next-intl';
import { assemblyModules, moduleConnections, moduleSections } from '@/lib/padWiring/assembly';
import { GroupsView } from '../views/GroupsView';
import { useWiringGuide } from '../WiringGuideContext';
import { RichText } from '../RichText';
import { WiringConnections } from './WiringConnections';
import { AssemblySteps } from './AssemblySteps';
import { useAssemblyProgress } from './useAssemblyProgress';
import styles from './assembly.module.css';

export function WiringWorkbench() {
  const guide = useWiringGuide();
  const t = useTranslations('Assembly');
  const modules = assemblyModules(guide);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('wiring');
  const [selected, setSelected] = useState('');
  const currentModule = modules[index];
  const connections = moduleConnections(guide, currentModule.id);
  const active = connections.find(connection => connection.id === selected) ?? connections[0];
  const progress = useAssemblyProgress(guide);
  return <section className={styles.workbench} data-wiring-workbench>
    <header className={styles.heading}>
      <div><span className={styles.eyebrow}>{guide.meta.title} · {guide.meta.rev}</span><h2>{t('title')}</h2><p>{t('intro')}</p></div>
      <Segmented value={mode} onChange={setMode} options={['wiring', 'assembly'].map(value => ({ value, label: t(value) }))} />
    </header>
    <label className={styles.selector}>{t('chooseModule')}
      <select value={index} onChange={event => { setIndex(Number(event.target.value)); setSelected(''); }}>
        {modules.map((item, i) => <option key={item.id} value={i}>{i + 1}. {item.name}</option>)}
      </select>
    </label>
    <ModulePanel title={currentModule.name} power={currentModule.power} tip={currentModule.tip} load={currentModule.load} />
    {mode === 'wiring' ? <WiringConnections connections={connections} selected={active?.id ?? ''} onSelect={setSelected} />
      : <AssemblySteps moduleId={currentModule.id} {...progress} />}
    <GroupsView sections={moduleSections(guide, currentModule.id)} initiallyOpen={false} />
    <footer className={styles.footer}>
      <Button disabled={index === 0} onClick={() => setIndex(index - 1)}>{t('previous')}</Button>
      <span>{index + 1} / {modules.length}</span>
      <Button disabled={index === modules.length - 1} onClick={() => setIndex(index + 1)}>{t('next')}</Button>
    </footer>
    <p className={styles.muted} role="status">{t('progress', { done: progress.done.length, total: progress.total })}</p>
    {progress.saveFailed ? <p role="alert">{t('saveFailed')}</p> : null}
  </section>;
}

function ModulePanel({ title, power, tip, load }: { title: string; power: string; tip?: string; load?: string }) {
  const t = useTranslations('Assembly');
  return <section className={styles.modulePanel}><h3>{title}</h3>
    <p><strong>{t('power')}:</strong> <RichText text={power} /></p>
    {tip ? <p><RichText text={tip} /></p> : null}
    {load ? <p><RichText text={load} /></p> : null}
  </section>;
}
