'use client';
import { useState, useEffect } from 'react';
import { Alert, Button, Input, Modal, Select, Space, Tag } from 'antd';
import { useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import { SpaceEditor } from './SpaceEditor';
import { WorkspaceTransfer } from './WorkspaceTransfer';
import { PresetShelf } from './PresetShelf';
import { makeRecord, type Workspace, type StoredDocument } from '@/lib/workspaces/model';
import { readStore } from '@/lib/workspaces/storage';
import { migrateLocal } from '@/lib/workspaces/migrate';
import { templates } from '@/lib/workspaces/resources';
import styles from './workspace.module.css';
import { trackWorkbench } from '@/lib/workbench/events';

export function SpacesWorkspace() {
  const t = useTranslations('Workspace');
  const { store, update, ready, busy, error, account, sync } = useWorkspaces();
  const [editing, setEditing] = useState<Workspace | null>(null);
  const spaces = store.records.filter(row => row.kind === 'workspaces' && !row.deleted)
    .sort((a, b) => ((a.document as Workspace).order ?? 0) - ((b.document as Workspace).order ?? 0));
  const active = spaces.find(row => row.id === store.activeId) ?? spaces[0];
  const space = active?.document as Workspace | undefined;
  useEffect(() => { if (space?.id) trackWorkbench('workspace_open'); }, [space?.id]);
  function save(document: Workspace) {
    void update(state => ({ ...state, activeId: document.id, records: state.records.some(row => row.id === document.id)
      ? state.records.map(row => row.id === document.id ? { ...row, document, dirty: true } : row)
      : [...state.records, makeRecord(document, 'workspaces')] }));
  }
  function create(template = '') {
    setEditing({ id: crypto.randomUUID(), version: 1, name: template ? t(`activities.${template}`) : t('new'),
      entries: (templates[template] ?? []).map(resourceId => ({ id: crypto.randomUUID(), resourceId })) });
  }
  async function importLocal() {
    const local = migrateLocal(await readStore('anonymous'));
    await update(state => ({ ...state, records: [...state.records, ...local.records.filter(row => !row.deleted && !state.records.some(r => r.id === row.id)).map(row => ({ ...row, revision: 0, dirty: true }))] }));
  }
  function reorder(direction: number) {
    const index = spaces.findIndex(row => row.id === space?.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= spaces.length) return;
    const ordered = [...spaces]; ordered.splice(target, 0, ordered.splice(index, 1)[0]);
    void update(state => ({ ...state, records: state.records.map(row => {
      const order = ordered.findIndex(item => item.id === row.id);
      return order < 0 ? row : { ...row, dirty: true, document: { ...row.document, order } };
    }) }));
  }
  function resolve(row: StoredDocument) {
    void update(state => ({ ...state, records: state.records.flatMap(item => item.id !== row.id ? [item] : [
      { ...item, conflict: undefined, dirty: true },
      makeRecord({ ...row.conflict!, id: crypto.randomUUID(), name: `${row.conflict!.name.slice(0, 80)} (copy)` }, row.kind),
    ]) }));
  }
  return <div className={styles.stack}>
    <div className={styles.hero}><h1>{t('title')}</h1><p>{t('intro')}</p><p>{t('privacy')}</p></div>
    {error ? <Alert type="error" message={t('error')} /> : null}
    <Space wrap><Tag>{t(store.records.some(row => row.conflict) ? 'conflict' : store.records.some(row => row.dirty) && account !== 'anonymous' ? 'pending' : 'saved')}</Tag>
      {account !== 'anonymous' ? <><Button disabled={!ready || busy} onClick={() => void sync()}>{t('sync')}</Button><Button disabled={!ready || busy} onClick={() => void importLocal()}>{t('importLocal')}</Button></> : <Button onClick={() => window.location.assign('/api/auth/github/start')}>{t('login')}</Button>}
    </Space>
    <div className={styles.toolbar}>
      <Select aria-label={t('selectSpace')} placeholder={t('selectSpace')} value={space?.id} disabled={!ready || busy}
        options={spaces.map(row => ({ value: row.id, label: row.document.name }))} onChange={activeId => void update(state => ({ ...state, activeId }))} />
      <Button disabled={!ready || busy} onClick={() => create()}>{t('new')}</Button>
      <Select aria-label={t('template')} placeholder={t('template')} value={null} disabled={!ready || busy} onChange={create}
        options={Object.keys(templates).map(value => ({ value, label: t(`activities.${value}`) }))} />
    </div>
    {space ? <section className={styles.card}>
      <div className={styles.row}><h2>{space.name}</h2><Space wrap>
        <Button disabled={busy || spaces[0]?.id === space.id} onClick={() => reorder(-1)}>{t('up')}</Button>
        <Button disabled={busy || spaces.at(-1)?.id === space.id} onClick={() => reorder(1)}>{t('down')}</Button>
        <Button disabled={busy} onClick={() => setEditing(space)}>{t('rename')}</Button>
        <Button disabled={busy} onClick={() => save({ ...space, id: crypto.randomUUID(), name: `${space.name.slice(0, 80)} (copy)` })}>{t('duplicate')}</Button>
        <Button disabled={busy} onClick={() => void update(state => ({ ...state, records: state.records.map(row => row.id === space.id ? { ...row, deleted: true, dirty: true } : row) }))}>{t('delete')}</Button>
      </Space></div>
      <SpaceEditor space={space} onChange={save} disabled={busy || !ready} />
    </section> : <p>{t('empty')}</p>}
    {store.records.filter(row => row.conflict).map(row => <Alert key={row.id} type="warning" message={`${t('conflict')}: ${row.document.name}`}
      description={<><pre style={{ maxHeight: 160, overflow: 'auto' }}>{JSON.stringify(row.conflict, null, 2)}</pre><Button onClick={() => resolve(row)} disabled={busy}>{t('resolve')}</Button></>} />)}
    <PresetShelf /><WorkspaceTransfer />
    <Modal open={!!editing} title={t('name')} onCancel={() => setEditing(null)} onOk={() => { if (editing?.name.trim()) { save(editing); setEditing(null); } }} okButtonProps={{ disabled: !editing?.name.trim() || busy }}>
      <Input aria-label={t('name')} maxLength={100} value={editing?.name ?? ''} onChange={e => setEditing(current => current ? { ...current, name: e.target.value } : null)} />
    </Modal>
  </div>;
}
