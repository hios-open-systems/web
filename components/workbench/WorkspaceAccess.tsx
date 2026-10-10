'use client';
import Link from 'next/link';
import { ArrowRightOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import styles from './workspace.module.css';

export function WorkspaceAccess() {
  const t = useTranslations('Workspace');
  const locale = useLocale();
  const { store } = useWorkspaces();
  const spaces = store.records.filter(row => row.kind === 'workspaces' && !row.deleted);
  const active = spaces.find(row => row.id === store.activeId) ?? spaces[0];
  return <Link href={`/${locale}/workbench/spaces`} className={styles.access}>
    <span className={styles.resourceIcon}><AppstoreOutlined aria-hidden /></span>
    <span><strong>{active ? active.document.name : t('mySpaces')}</strong><small>{active ? t('continue') : t('spaceHint')}</small></span>
    <ArrowRightOutlined aria-hidden />
  </Link>;
}
