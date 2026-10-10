'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Collapse, Input, Modal, Spin, Tag } from 'antd';
import { AppstoreOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useLocale } from 'next-intl';
import { SpaceEditor } from './SpaceEditor';
import { WorkspaceTransfer } from './WorkspaceTransfer';
import { PresetShelf } from './PresetShelf';
import { SpaceSidebar, SpaceActions } from './SpaceNavigation';
import { useSpacesWorkspace } from './useSpacesWorkspace';
import styles from './workspace.module.css';

export function SpacesWorkspace() {
  const state = useSpacesWorkspace();
  const { t, store, update, ready, busy, error, account, sync, editing, setEditing, space, save, create, importLocal, resolve } = state;
  const locale = useLocale();
  const [organizing, setOrganizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const remove = () => { if (space) void update(current => ({ ...current, records: current.records.map(row => row.id === space.id ? { ...row, deleted: true, dirty: true } : row) })); setDeleting(false); };
  return <div className={styles.stack}>
    <header className={styles.exploreHero}><div><span className={styles.eyebrow}>HIOS / {t('mySpaces')}</span><h1>{t('mySpaces')}</h1><p>{t('intro')}</p></div><Link className={styles.primaryLink} href={`/${locale}/explore`}>{t('findResources')} <ArrowRightOutlined aria-hidden /></Link></header>
    {error ? <Alert type="error" showIcon message={t('error')} /> : null}
    <div className={styles.workspaceLayout}>
      <SpaceSidebar state={state} onSelect={() => setOrganizing(false)} />
      <section className={styles.spaceContent}>
        {!ready ? <Spin /> : space ? <><div className={styles.row}><div><h2 className={styles.spaceTitle}>{space.name}</h2><span className={styles.muted}>{t('resourceCount', { count: space.entries.length })}</span></div><SpaceActions state={state} organizing={organizing} onOrganize={() => setOrganizing(!organizing)} onDelete={() => setDeleting(true)} /></div><SpaceEditor space={space} onChange={save} disabled={busy || !ready} organizing={organizing} /></> : <div className={styles.emptyState}><AppstoreOutlined aria-hidden /><h2>{t('firstSpace')}</h2><p>{t('firstSpaceHint')}</p><Button type="primary" icon={<PlusOutlined aria-hidden />} disabled={busy} onClick={() => create()}>{t('createFirst')}</Button></div>}
      </section>
    </div>
    <div className={styles.syncBar}><Tag>{t(store.records.some(row => row.conflict) ? 'conflict' : store.records.some(row => row.dirty) && account !== 'anonymous' ? 'pending' : account === 'anonymous' ? 'saved' : 'synced')}</Tag><span>{t('privacy')}</span>{account !== 'anonymous' ? <Button type="text" disabled={!ready || busy} onClick={() => void sync()}>{t('sync')}</Button> : <Button type="text" onClick={() => window.location.assign('/api/auth/github/start')}>{t('login')}</Button>}</div>
    {store.records.filter(row => row.conflict).map(row => <Alert key={row.id} type="warning" message={`${t('conflict')}: ${row.document.name}`} description={<><pre style={{ maxHeight: 160, overflow: 'auto' }}>{JSON.stringify(row.conflict, null, 2)}</pre><Button onClick={() => resolve(row)} disabled={busy}>{t('resolve')}</Button></>} />)}
    <div className={styles.card}><PresetShelf /></div>
    <Collapse items={[{ key: 'backup', label: t('backup'), children: <div className={styles.stack}><p>{t('backupHint')}</p><WorkspaceTransfer />{account !== 'anonymous' ? <Button disabled={!ready || busy} onClick={() => void importLocal()}>{t('importLocal')}</Button> : null}</div> }]} />
    <Modal open={!!editing} title={t('name')} onCancel={() => setEditing(null)} onOk={() => { if (editing?.name.trim()) { save({ ...editing, name: editing.name.trim() }); setEditing(null); } }} okButtonProps={{ disabled: !editing?.name.trim() || busy }}><Input autoFocus aria-label={t('name')} maxLength={100} value={editing?.name ?? ''} onChange={e => setEditing(current => current ? { ...current, name: e.target.value } : null)} /></Modal>
    <Modal open={deleting} title={t('deleteSpaceTitle', { name: space?.name ?? '' })} okText={t('delete')} cancelText={t('cancel')} okButtonProps={{ danger: true, disabled: busy }} onOk={remove} onCancel={() => setDeleting(false)}><p>{t('deleteSpaceHint')}</p></Modal>
  </div>;
}
