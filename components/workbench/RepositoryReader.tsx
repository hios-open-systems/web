'use client';
import { useState } from 'react';
import { Alert, Button, Input } from 'antd';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import { PageIntro } from '@/components/ui/PageIntro';
import { useRepositoryReader } from '@/lib/hooks/useRepositoryReader';
import { downloadBlob } from '@/lib/workbench/download';
import styles from './repositoryReader.module.css';

export function RepositoryReader() {
  const t = useTranslations('Repositories');
  const state = useRepositoryReader();
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [token, setToken] = useState('');
  const connect = () => { state.connect(url, branch, token); setToken(''); };
  return <div className={styles.reader}>
    <PageIntro eyebrow="HIOS / REPOSITORIES" title={t('title')} description={t('description')} area="development" compact />
    <Alert type="info" message={t('privacy')} />
    {!state.connected ? <form className={styles.connect} onSubmit={event => { event.preventDefault(); connect(); }}>
      <label>{t('url')}<Input required type="url" value={url} onChange={event => setUrl(event.target.value)}
        placeholder="https://github.com/owner/repo" /></label>
      <label>{t('branch')}<Input value={branch} maxLength={200} onChange={event => setBranch(event.target.value)} /></label>
      <label>{t('token')}<Input.Password required autoComplete="off" value={token}
        onChange={event => setToken(event.target.value)} /></label>
      <p>{t('permissions')}</p>
      <Button htmlType="submit" type="primary" loading={state.busy}>{t('connect')}</Button>
    </form> : <div className={styles.toolbar}>
      <span>{url}</span><Button onClick={() => { state.disconnect(); setToken(''); }}>{t('disconnect')}</Button>
    </div>}
    {state.error && <Alert type="error" message={t('error')} />}
    {state.connected && <div className={styles.layout}>
      <nav aria-label={t('files')} className={styles.files}>
        <strong>{state.path || '/'}</strong>
        {state.path && <Button disabled={state.busy} onClick={() => void state.load(state.path.split('/').slice(0, -1).join('/'), true)}>..</Button>}
        {state.entries.map(entry => <Button type="text" key={entry.path} disabled={state.busy}
          onClick={() => void state.load(entry.path, entry.directory)}>{entry.directory ? '▸ ' : ''}{entry.name}</Button>)}
        {!state.entries.length && <p>{t('empty')}</p>}
        {state.limited && <p>{t('limited')}</p>}
        <div className={styles.toolbar}>
          {state.page > 1 && <Button disabled={state.busy} onClick={() => void state.load(state.path, true, state.page - 1)}>←</Button>}
          {state.more && <Button disabled={state.busy} onClick={() => void state.load(state.path, true, state.page + 1)}>{t('more')} →</Button>}
        </div>
      </nav>
      <RepositoryDocument state={state} />
    </div>}
  </div>;
}

function RepositoryDocument({ state }: { state: ReturnType<typeof useRepositoryReader> }) {
  const t = useTranslations('Repositories');
  const [preview, setPreview] = useState(false);
  return <section className={styles.document} aria-label={t('document')}>
    {state.file ? <>
      <div className={styles.toolbar}><strong>{state.file}</strong>
        <Button aria-pressed={preview} onClick={() => setPreview(!preview)}>{t('preview')}</Button>
        <Button onClick={() => downloadBlob(state.text,
          state.file.split('/').pop() || 'document.md', 'text/plain;charset=utf-8')}>{t('download')}</Button>
      </div>
      <p>{t('draft')}</p>
      {preview ? <div className={styles.markdown}><ReactMarkdown skipHtml components={{
        img: ({ alt }) => <span>[{alt || t('image')}]</span>,
        a: ({ children }) => <span>{children}</span>,
      }}>{state.text}</ReactMarkdown></div>
        : <Input.TextArea aria-label={t('document')} value={state.text} onChange={event => state.setText(event.target.value)}
          autoSize={{ minRows: 18, maxRows: 35 }} />}
    </> : <p>{t('select')}</p>}
  </section>;
}
