'use client';
import { Button, Dropdown } from 'antd';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import type { Workspace } from '@/lib/workspaces/model';
import { makeRecord } from '@/lib/workspaces/model';

export function SaveToSpace({ resourceId, presetId }: { resourceId: string; presetId?: string }) {
  const t = useTranslations('Workspace');
  const { store, update, ready, busy } = useWorkspaces();
  const spaces = store.records.filter(row => row.kind === 'workspaces' && !row.deleted);
  const contains = (document: Workspace) => document.entries.some(entry => entry.resourceId === resourceId && entry.presetId === presetId);
  const saved = spaces.some(row => contains(row.document as Workspace));
  function add(id: string) {
    void update(state => {
      if (id === 'new') {
        const document: Workspace = { id: crypto.randomUUID(), version: 1, name: t('defaultSpace'), entries: [{ id: crypto.randomUUID(), resourceId, presetId }] };
        return { ...state, activeId: document.id, records: [...state.records, makeRecord(document, 'workspaces')] };
      }
      return { ...state, activeId: id, records: state.records.map(row => {
        if (row.id !== id) return row;
        const document = row.document as Workspace;
        if (document.entries.some(entry => entry.resourceId === resourceId && entry.presetId === presetId)) return row;
        return { ...row, dirty: true, document: { ...document, entries: [...document.entries, { id: crypto.randomUUID(), resourceId, presetId }] } };
      }) };
    });
  }
  return <Dropdown trigger={['click']} menu={{ items: [...spaces.map(row => ({ key: row.id, label: row.document.name, icon: contains(row.document as Workspace) ? <CheckOutlined aria-hidden /> : <PlusOutlined aria-hidden />, disabled: contains(row.document as Workspace) })), { key: 'new', label: t('new'), icon: <PlusOutlined aria-hidden /> }], onClick: ({ key }) => add(key) }}>
    <Button type="text" icon={saved ? <CheckOutlined aria-hidden /> : <PlusOutlined aria-hidden />} disabled={!ready || busy}>{t(saved ? 'addedToSpace' : 'addToSpace')}</Button>
  </Dropdown>;
}
