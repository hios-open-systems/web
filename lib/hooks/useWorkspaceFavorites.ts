'use client';
import { useWorkspaces } from '@/components/workbench/WorkspaceProvider';
import { makeRecord, type Workspace } from '@/lib/workspaces/model';
import { useTranslations } from 'next-intl';
export function useWorkspaceFavorites() {
  const { store, update, ready, busy } = useWorkspaces();
  const t = useTranslations('Workspace');
  const record = store.records.find(row => row.id === 'favorites' && !row.deleted);
  const workspace = record?.document as Workspace | undefined;
  const pinned = workspace?.entries.map(entry => entry.resourceId.replace(/^tool:/, '')) ?? [];
  function toggle(id: string) {
    void update(state => {
      const current = state.records.find(row => row.id === 'favorites');
      const document: Workspace = (current?.document as Workspace | undefined) ?? { id: 'favorites', name: t('favorite'), version: 1, entries: [] };
      const resourceId = `tool:${id}`;
      const entries = document.entries.some(entry => entry.resourceId === resourceId)
        ? document.entries.filter(entry => entry.resourceId !== resourceId)
        : [...document.entries, { id: crypto.randomUUID(), resourceId }];
      const next = { ...(current ?? makeRecord(document, 'workspaces')), document: { ...document, entries }, deleted: false, dirty: true };
      return { ...state, records: [...state.records.filter(row => row.id !== 'favorites'), next] };
    });
  }
  return { pinned, toggle, disabled: !ready || busy };
}
