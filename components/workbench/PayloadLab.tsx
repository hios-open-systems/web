'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Input, Space, Tabs, Tag, message } from 'antd';
import { useTranslations } from 'next-intl';
import { usePayloadWorker } from '@/lib/hooks/usePayloadWorker';
import { useToolBridge } from '@/lib/hooks/useToolBridge';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { iterationExample, payloadPaths, type PayloadNode, type PayloadPath } from '@/lib/workbench/payloadEngine';
import { ToolHeader } from './ToolHeader';
import { PayloadTree } from './PayloadTree';
import { PayloadTable } from './PayloadTable';
import { PresetControls } from './PresetControls';
import { SendToMenu } from '@/components/common/SendToMenu';
import styles from './payloadLab.module.css';

const EXAMPLE = JSON.stringify({ requestId: 'REQ-42', user: { id: 18, role: 'maintainer' }, columns: [{ name: 'price', aggregate: 'sum' }, { name: 'count', aggregate: 'sum' }] }, null, 2);
export function PayloadLab() {
  const t = useTranslations('Workspace');
  const old = useTranslations('Workbench.payload');
  const [input, setInput] = useState(EXAMPLE);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<PayloadNode | null>(null);
  const [output, setOutput] = useState('');
  const [selectedStats, setSelectedStats] = useState('');
  const [minified, setMinified] = useState(false);
  const [split, setSplit] = useState(50);
  const [api, contextHolder] = message.useMessage();
  const copy = useCopyToClipboard(api);
  const { analysis, busy, error, cancel, read } = usePayloadWorker(input);
  useToolBridge('payload', values => { if (values.payload !== undefined) setInput(values.payload); if (values.view) setMinified(values.view === 'minified'); });
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const incoming = hash.get('p') ?? query.get('payload');
    if (incoming !== null) setInput(incoming);
    if (query.get('view') === 'minified') setMinified(true);
    if (query.has('payload')) { query.delete('payload'); history.replaceState(null, '', `${location.pathname}${query.size ? '?' + query : ''}${location.hash}`); }
    setHydrated(true);
  }, []);
  useEffect(() => { setSelected(analysis?.nodes[0] ?? null); }, [analysis]);
  useEffect(() => {
    let active = true;
    setOutput('');
    setSelectedStats('');
    if (selected && analysis) Promise.all([read(selected.path, 'preview', minified), read(selected.path, 'stats')]).then(([text, stats]) => {
      if (active) { setOutput(text); setSelectedStats(stats); }
    }).catch(() => { if (active) setOutput(''); });
    return () => { active = false; };
  }, [selected, analysis, minified, read]);
  async function full(path: PayloadPath = selected?.path ?? []) { return read(path, 'copy', minified); }
  async function copyValue(path?: PayloadPath) {
    try { await copy(await full(path), t('copied')); } catch { api.error(t('error')); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([input], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'payload.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() {
    const url = `${location.origin}${location.pathname}#p=${encodeURIComponent(input)}`;
    if (url.length > 12_000) { api.info(t('linkTooLarge')); return; }
    await copy(url, t('copied'));
  }
  const paths = selected ? payloadPaths(selected.path) : null;
  const inspector = <Space direction="vertical" style={{ width: '100%' }}>
    <h3>{t('selected')} · {selected?.key}</h3>
    <Space wrap><Button disabled={!selected || busy} onClick={() => void copyValue()}>{t('copy')}</Button>
      <SendToMenu kind="json" getValue={() => full()} />
    </Space>
    {paths ? Object.entries(paths).map(([key, value]) => <div key={key}><code>{key}: {value || '""'}</code> <Button size="small" onClick={() => void copy(value, t('copied'))}>{t('copyPath')}</Button></div>) : null}
    {selected ? <pre className={styles.code}>{iterationExample(selected)}</pre> : null}
  </Space>;
  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    {contextHolder}
    <ToolHeader eyebrow={old('badge')} title={old('title')} description={old('subtitle')} locality="local" actions={<Space wrap>
      <Button onClick={() => setInput(EXAMPLE)}>{t('example')}</Button><Button onClick={() => setInput('')}>{t('clear')}</Button>
      <Button disabled={!analysis || busy} onClick={() => void copyValue([])}>{old('copyOutput')}</Button>
      <Button onClick={() => setMinified(value => !value)}>{minified ? old('prettify') : old('minify')}</Button>
      <Button onClick={download}>{t('download')}</Button><Button onClick={() => void share()}>{t('share')}</Button>
      <PresetControls toolId="payload" settings={{ view: minified ? 'minified' : 'pretty' }} content={{ payload: input }} />
    </Space>} />
    {busy ? <Space><span role="status">{t('processing')}</span><Button onClick={cancel}>{t('cancelProcessing')}</Button></Space> : null}
    {error ? <Alert type="error" message={t(error === 'tooLarge' ? 'tooLarge' : 'invalid')} description={error === 'tooLarge' ? undefined : error} /> : null}
    {analysis ? <Space wrap><Tag>{analysis.bytes} B</Tag><Tag>{analysis.nodes.length} nodes</Tag><Tag>↳ {analysis.depth}</Tag>
      {analysis.partial ? <Tag color="orange">{t('partial')}</Tag> : null}{analysis.bytes > 1024 * 1024 ? <Tag color="orange">{t('large')}</Tag> : null}</Space> : null}
    <label className={styles.resize}>{t('input')} ↔ {t('output')} <input type="range" min={30} max={70} value={split} aria-label={`${t('input')} / ${t('output')}`} onChange={e => setSplit(Number(e.target.value))} /></label>
    <div className={styles.panels} style={{ gridTemplateColumns: `minmax(0, ${split}fr) minmax(0, ${100 - split}fr)` }}>
      <Card title={t('input')} className={styles.editor}><Input.TextArea disabled={!hydrated} spellCheck={false} autoCorrect="off" autoCapitalize="off" aria-label={t('input')} value={input} onChange={event => setInput(event.target.value)} autoSize={{ minRows: 15, maxRows: 25 }} /></Card>
      <Card className={styles.output}><Tabs items={[
        { key: 'tree', label: t('tree'), children: analysis ? <PayloadTree nodes={analysis.nodes} selected={selected?.id ?? 0} onSelect={setSelected} /> : null },
        { key: 'output', label: t('output'), children: <><pre className={styles.code}>{output}</pre>{output.length >= 100_000 ? <Tag>{t('partial')}</Tag> : null}</> },
        { key: 'table', label: t('table'), children: <PayloadTable text={output} /> },
        { key: 'analysis', label: t('analysis'), children: <><h3>{t('selected')}</h3><pre className={styles.code}>{selectedStats}</pre></> },
      ]} /></Card>
    </div><Card>{inspector}</Card>
  </Space>;
}
