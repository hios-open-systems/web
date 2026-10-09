'use client';
import Link from 'next/link';
import { Button, Select, Space } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { resources } from '@/lib/workspaces/resources';
import type { Workspace, ToolPreset } from '@/lib/workspaces/model';
import { useWorkspaces } from './WorkspaceProvider';
import { createHandoff } from '@/lib/workbench/handoff';
import styles from './workspace.module.css';

export function SpaceEditor({ space, onChange, disabled }: { space: Workspace; onChange: (space: Workspace) => void; disabled: boolean }) {
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const locale = useLocale();
  const { store } = useWorkspaces();
  const label = (id: string) => id.startsWith('tool:') ? packs(`${id.slice(5)}.title`) : resources.find(r => r.id === id)?.label ?? id;
  function move(from: number, to: number) {
    if (to < 0 || to >= space.entries.length) return;
    const entries = [...space.entries];
    entries.splice(to, 0, entries.splice(from, 1)[0]);
    onChange({ ...space, entries });
  }
  return <section className={styles.stack}>
    <Select showSearch value={null} disabled={disabled} placeholder={t('add')} aria-label={t('add')} optionFilterProp="label"
      options={resources.map(r => ({ value: r.id, label: label(r.id) }))}
      onChange={(resourceId: string) => onChange({ ...space, entries: [...space.entries, { id: crypto.randomUUID(), resourceId }] })} />
    <div>{space.entries.map((entry, index) => <div key={entry.id} className={styles.entry} draggable={!disabled}
      onDragStart={event => event.dataTransfer.setData('text/plain', entry.id)}
      onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); const from = space.entries.findIndex(row => row.id === event.dataTransfer.getData('text/plain')); if (from >= 0 && !disabled) move(from, index); }}>
      <Link href={`/${locale}${resources.find(r => r.id === entry.resourceId)?.href ?? '/workbench'}`} onClick={event => {
        if (!entry.presetId) return;
        const preset = store.records.find(row => row.id === entry.presetId && !row.deleted)?.document as ToolPreset | undefined;
        if (!preset) return;
        event.preventDefault();
        const handoff = createHandoff(preset.toolId, { ...preset.settings, ...preset.content });
        window.location.assign(`/${locale}${resources.find(r => r.id === entry.resourceId)?.href ?? '/workbench'}?handoff=${handoff}`);
      }}>{entry.presetId ? store.records.find(row => row.id === entry.presetId)?.document.name ?? label(entry.resourceId) : label(entry.resourceId)}</Link>
      <Space wrap><Button disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label={`${t('up')}: ${label(entry.resourceId)}`}>↑</Button>
        <Button disabled={disabled || index === space.entries.length - 1} onClick={() => move(index, index + 1)} aria-label={`${t('down')}: ${label(entry.resourceId)}`}>↓</Button>
        <Button disabled={disabled} onClick={() => onChange({ ...space, entries: space.entries.filter(row => row.id !== entry.id) })}>{t('delete')}</Button></Space>
    </div>)}</div>
    {!space.entries.length ? <p>{t('empty')}</p> : null}
  </section>;
}
