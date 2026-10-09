'use client';
import { useRef, useState } from 'react';
import { Alert, Button, Checkbox, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { useWorkspaces } from './WorkspaceProvider';
import { makeRecord, parseStore } from '@/lib/workspaces/model';

export function WorkspaceTransfer() {
  const { store, update, ready, busy } = useWorkspaces();
  const t = useTranslations('Workspace');
  const [includeContent, setIncludeContent] = useState(false);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function download() {
    const records = store.records.filter(row => !row.deleted).map(row => {
      const document = { ...row.document };
      if ('syncContent' in document) { document.syncContent = false; if (!includeContent) delete document.content; }
      return makeRecord(document, row.kind);
    });
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, records }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'openhios-workspaces.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function upload(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw new Error('size');
      const imported = parseStore(JSON.parse(await file.text()));
      const ids = new Map(imported.records.map(row => [row.id, crypto.randomUUID()]));
      const records = imported.records.filter(row => !row.deleted).map(row => {
        const document = { ...row.document, id: ids.get(row.id)! };
        if ('syncContent' in document) document.syncContent = false;
        else document.entries = document.entries.map(entry => ({ ...entry, id: crypto.randomUUID(), presetId: entry.presetId ? ids.get(entry.presetId) : undefined }));
        return makeRecord(document, row.kind);
      });
      await update(state => ({ ...state, records: [...state.records, ...records] })); setError(false);
    } catch { setError(true); }
    if (input.current) input.current.value = '';
  }
  return <Space wrap>
    <Checkbox checked={includeContent} onChange={e => setIncludeContent(e.target.checked)}>{t('includeContent')}</Checkbox>
    <Button disabled={!ready || busy} onClick={download}>{t('export')}</Button>
    <Button disabled={!ready || busy} onClick={() => input.current?.click()}>{t('import')}</Button>
    <input ref={input} type="file" accept="application/json,.json" hidden onChange={e => void upload(e.target.files?.[0])} />
    {error ? <Alert type="error" message={t('invalidImport')} /> : null}
  </Space>;
}
