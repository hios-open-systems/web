'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import { makeRecord, type Workspace, type StoredDocument } from '@/lib/workspaces/model';
import { readStore } from '@/lib/workspaces/storage';
import { migrateLocal } from '@/lib/workspaces/migrate';
import { templates } from '@/lib/workspaces/resources';
import { trackWorkbench } from '@/lib/workbench/events';

export function useSpacesWorkspace() {
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
  return { t, store, update, ready, busy, error, account, sync, editing, setEditing, spaces, space, save, create, importLocal, reorder, resolve };
}
