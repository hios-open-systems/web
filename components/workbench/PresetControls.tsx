'use client';
import { useState } from 'react';
import { Button, Checkbox, Input, Modal, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import { makeRecord } from '@/lib/workspaces/model';

export function PresetControls({ toolId, settings = {}, content = {} }: {
  toolId: string; settings?: Record<string, string>; content?: Record<string, string>;
}) {
  const t = useTranslations('Workspace');
  const { update, account, ready, busy } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [syncContent, setSyncContent] = useState(false);
  async function save() {
    await update(state => ({ ...state, records: [...state.records, makeRecord({ id: crypto.randomUUID(), version: 1,
      toolId, name: name.trim(), settings, content, syncContent: account !== 'anonymous' && syncContent }, 'presets')] }));
    setOpen(false); setSyncContent(false);
  }
  return <>
    <Button disabled={!ready || busy} onClick={() => { setName(t('newPreset')); setOpen(true); }}>{t('savePreset')}</Button>
    <Modal open={open} title={t('savePreset')} onCancel={() => setOpen(false)} onOk={() => void save()} okButtonProps={{ disabled: !name.trim() || busy }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input value={name} maxLength={100} aria-label={t('name')} onChange={e => setName(e.target.value)} />
        {account !== 'anonymous' ? <Checkbox checked={syncContent} onChange={e => setSyncContent(e.target.checked)}>{t('uploadContent')}</Checkbox> : <p>{t('presetPrivacy')}</p>}
        <p>{t(account === 'anonymous' ? 'localPreview' : 'preview')}</p><pre style={{ maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(account === 'anonymous' || syncContent ? { settings, content } : { settings }, null, 2)}</pre>
      </Space>
    </Modal>
  </>;
}
