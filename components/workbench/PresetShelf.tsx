'use client';
import { useState } from 'react';
import { Button, Modal, Space } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import { workbenchTools } from '@/config/workbench';
import { createHandoff } from '@/lib/workbench/handoff';
import type { ToolPreset } from '@/lib/workspaces/model';
import styles from './workspace.module.css';
import { trackWorkbench } from '@/lib/workbench/events';
import { SaveToSpace } from './SaveToSpace';

export function PresetShelf() {
  const { store, busy, update, account } = useWorkspaces();
  const locale = useLocale();
  const t = useTranslations('Workspace');
  const [preview, setPreview] = useState<ToolPreset | null>(null);
  const presets = store.records.filter(row => row.kind === 'presets' && !row.deleted).map(row => row.document as ToolPreset);
  function open(preset: ToolPreset) {
    const tool = workbenchTools.find(item => item.id === preset.toolId);
    if (!tool) return;
    const id = createHandoff(tool.id, { ...preset.settings, ...preset.content });
    trackWorkbench('preset_reuse', tool.id);
    window.location.assign(`/${locale}${tool.href}?handoff=${id}`);
  }
  return <section className={styles.stack}><h2>{t('presets')}</h2>
    {!presets.length ? <p>{t('noPresets')}</p> : null}
    {presets.map(preset => <div key={preset.id} className={styles.entry}>
      <strong>{preset.name}</strong><span>{preset.toolId}</span><Space wrap>
        <Button onClick={() => open(preset)}>{t('open')}</Button>
        <SaveToSpace resourceId={`tool:${preset.toolId}`} presetId={preset.id} />
        {account !== 'anonymous' && preset.content ? <Button disabled={busy} onClick={() => setPreview(preset)}>{t('uploadContent')}</Button> : null}
        <Button disabled={busy} onClick={() => void update(state => ({ ...state, records: state.records.map(row => row.id === preset.id ? { ...row, deleted: true, dirty: true } : row) }))}>{t('delete')}</Button>
      </Space>
    </div>)}
    <Modal open={!!preview} title={t('preview')} onCancel={() => setPreview(null)} onOk={() => {
      if (preview) void update(state => ({ ...state, records: state.records.map(row => row.id === preview.id ? { ...row, document: { ...preview, syncContent: true }, dirty: true } : row) }));
      setPreview(null);
    }} okButtonProps={{ disabled: busy }}>
      <p>{t('syncPreview')}</p><pre style={{ maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(preview, null, 2)}</pre>
    </Modal>
  </section>;
}
