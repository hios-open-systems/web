'use client';
import { Button, Dropdown, Select, Space } from 'antd';
import { AppstoreOutlined, EditOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { templates } from '@/lib/workspaces/resources';
import type { useSpacesWorkspace } from './useSpacesWorkspace';
import styles from './workspace.module.css';

type SpaceState = ReturnType<typeof useSpacesWorkspace>;

export function SpaceSidebar({ state, onSelect }: { state: SpaceState; onSelect: () => void }) {
  const { t, spaces, space, ready, busy, update, create } = state;
  return <aside className={styles.sidebar} aria-label={t('spaces')}>
    <span className={styles.eyebrow}>{t('spaces')} · {spaces.length}</span>
    <nav className={styles.spaceList}>
      {spaces.map(row => <button key={row.id} disabled={!ready || busy}
        className={row.id === space?.id ? styles.spaceActive : styles.spaceButton}
        aria-current={row.id === space?.id ? 'page' : undefined}
        onClick={() => { onSelect(); void update(current => ({ ...current, activeId: row.id })); }}>
        <AppstoreOutlined aria-hidden /><span>{row.document.name}</span>
      </button>)}
    </nav>
    <Button block type="primary" icon={<PlusOutlined aria-hidden />} disabled={!ready || busy} onClick={() => create()}>{t('new')}</Button>
    <details className={styles.templates}>
      <summary>{t('startTemplate')}</summary>
      <Select aria-label={t('template')} placeholder={t('template')} value={null}
        disabled={!ready || busy} onChange={create}
        options={Object.keys(templates).map(value => ({ value, label: t(`activities.${value}`) }))} />
      <p className={styles.sidebarHint}>{t('spaceHint')}</p>
    </details>
  </aside>;
}

interface ActionsProps {
  state: SpaceState;
  organizing: boolean;
  onOrganize: () => void;
  onDelete: () => void;
}

export function SpaceActions({ state, organizing, onOrganize, onDelete }: ActionsProps) {
  const { t, space, spaces, busy, setEditing, save, reorder } = state;
  if (!space) return null;
  function select(key: string) {
    if (!space) return;
    if (key === 'rename') setEditing(space);
    if (key === 'duplicate') save({ ...space, id: crypto.randomUUID(), name: t('copyName', { name: space.name.slice(0, 80) }) });
    if (key === 'up') reorder(-1);
    if (key === 'down') reorder(1);
    if (key === 'delete') onDelete();
  }
  return <Space wrap>
    <Button icon={<EditOutlined aria-hidden />} type={organizing ? 'primary' : 'default'}
      disabled={busy} onClick={onOrganize}>{t(organizing ? 'done' : 'organize')}</Button>
    <Dropdown trigger={['click']} menu={{ onClick: ({ key }) => select(key), items: [
      { key: 'rename', label: t('rename') },
      { key: 'duplicate', label: t('duplicate') },
      { key: 'up', label: t('up'), disabled: spaces[0]?.id === space.id },
      { key: 'down', label: t('down'), disabled: spaces.at(-1)?.id === space.id },
      { type: 'divider' },
      { key: 'delete', label: t('delete'), danger: true },
    ] }}>
      <Button disabled={busy} icon={<MoreOutlined aria-hidden />} aria-label={t('spaceOptions')} />
    </Dropdown>
  </Space>;
}
