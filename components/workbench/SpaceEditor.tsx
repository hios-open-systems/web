'use client';
import Link from 'next/link';
import { Button, Select, Space } from 'antd';
import { ArrowRightOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { resources } from '@/lib/workspaces/resources';
import type { Workspace, ToolPreset } from '@/lib/workspaces/model';
import { useWorkspaces } from './WorkspaceProvider';
import { createHandoff } from '@/lib/workbench/handoff';
import { useResourceCopy } from './useResourceCopy';
import styles from './workspace.module.css';

export function SpaceEditor({ space, onChange, disabled, organizing = false }: { space: Workspace; onChange: (space: Workspace) => void; disabled: boolean; organizing?: boolean }) {
  const t = useTranslations('Workspace');
  const locale = useLocale();
  const { store } = useWorkspaces();
  const { label, description } = useResourceCopy();
  function move(from: number, to: number) {
    if (to < 0 || to >= space.entries.length) return;
    const entries = [...space.entries];
    entries.splice(to, 0, entries.splice(from, 1)[0]);
    onChange({ ...space, entries });
  }
  return <section className={styles.stack}>
    {organizing ? <Select showSearch value={null} disabled={disabled} placeholder={t('addResource')} aria-label={t('addResource')} optionFilterProp="label"
      options={resources.filter(r => !space.entries.some(entry => entry.resourceId === r.id && !entry.presetId)).map(r => ({ value: r.id, label: label(r.id) }))}
      onChange={(resourceId: string) => onChange({ ...space, entries: [...space.entries, { id: crypto.randomUUID(), resourceId }] })} /> : null}
    <div className={styles.resourceGrid}>{space.entries.map((entry, index) => <div key={entry.id} className={styles.resourceCard} draggable={organizing && !disabled}
      onDragStart={event => event.dataTransfer.setData('text/plain', entry.id)}
      onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); const from = space.entries.findIndex(row => row.id === event.dataTransfer.getData('text/plain')); if (from >= 0 && !disabled && organizing) move(from, index); }}>
      <span className={styles.resourceIcon}><AppstoreOutlined aria-hidden /></span>
      <Link className={styles.resourceTitle} href={`/${locale}${resources.find(r => r.id === entry.resourceId)?.href ?? '/workbench'}`} onClick={event => {
        if (!entry.presetId) return;
        const preset = store.records.find(row => row.id === entry.presetId && !row.deleted)?.document as ToolPreset | undefined;
        if (!preset) return;
        event.preventDefault();
        const handoff = createHandoff(preset.toolId, { ...preset.settings, ...preset.content });
        window.location.assign(`/${locale}${resources.find(r => r.id === entry.resourceId)?.href ?? '/workbench'}?handoff=${handoff}`);
      }}><h3>{entry.presetId ? store.records.find(row => row.id === entry.presetId)?.document.name ?? label(entry.resourceId) : label(entry.resourceId)} <ArrowRightOutlined aria-hidden /></h3></Link>
      {description(entry.resourceId) ? <p>{description(entry.resourceId)}</p> : null}
      {organizing ? <Space wrap><Button disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label={`${t('up')}: ${label(entry.resourceId)}`}>↑</Button>
        <Button disabled={disabled || index === space.entries.length - 1} onClick={() => move(index, index + 1)} aria-label={`${t('down')}: ${label(entry.resourceId)}`}>↓</Button>
        <Button type="text" danger icon={<DeleteOutlined aria-hidden />} disabled={disabled} onClick={() => onChange({ ...space, entries: space.entries.filter(row => row.id !== entry.id) })}>{t('removeFromSpace')}</Button></Space> : null}
    </div>)}</div>
    {!space.entries.length ? <div className={styles.emptyState}><AppstoreOutlined aria-hidden /><h3>{t('empty')}</h3><p>{t('emptyHint')}</p><Link className={styles.primaryLink} href={`/${locale}/explore`}>{t('findResources')} <ArrowRightOutlined aria-hidden /></Link></div> : null}
  </section>;
}
