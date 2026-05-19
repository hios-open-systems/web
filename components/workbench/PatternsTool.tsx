'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography } from 'antd';
import { CaretRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/lib/ThemeContext';
import { LESSONS, getLesson } from '@/lib/workbench/patterns';
import { ToolHeader } from './ToolHeader';
import { CopyButton } from './CopyButton';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;
const LS_KEY = 'hios-patterns';

// Sandboxed runner: no allow-same-origin -> the user's code cannot touch the
// site DOM, our localStorage, cookies or session. It runs isolated, logs are
// collected for ~1.2s (covers setTimeout-based examples) and posted back.
const RUNNER_SRCDOC = `<!doctype html><meta charset="utf-8"><script>
const logs = [];
const fmt = (a) => a.map(x => {
  try { return typeof x === 'string' ? x : JSON.stringify(x); } catch { return String(x); }
}).join(' ');
['log','info','warn','error'].forEach(k => { console[k] = (...a) => logs.push(fmt(a)); });
addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'run') return;
  logs.length = 0;
  try {
    (0, eval)('(async () => {\\n' + e.data.code + '\\n})()');
  } catch (err) {
    logs.push('Error: ' + (err && err.message ? err.message : String(err)));
  }
  setTimeout(() => parent.postMessage({ type: 'result', logs }, '*'), 1200);
});
parent.postMessage({ type: 'ready' }, '*');
<\/script>`;

export function PatternsTool() {
  const t = useTranslations('Workbench.patterns');
  const { mode } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hydrated = useRef(false);

  const [activeId, setActiveId] = useState(LESSONS[0].id);
  const [code, setCode] = useState(LESSONS[0].code);
  const [output, setOutput] = useState<string>('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.version === 1 && getLesson(parsed.lastLesson)) {
        setActiveId(parsed.lastLesson);
        setCode(parsed.edits?.[parsed.lastLesson] ?? getLesson(parsed.lastLesson)!.code);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      const edits = { ...(prev.edits ?? {}), [activeId]: code };
      window.localStorage.setItem(LS_KEY, JSON.stringify({ version: 1, lastLesson: activeId, edits }));
    } catch {
      /* non-fatal */
    }
  }, [activeId, code]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === 'result') {
        setOutput(
          (e.data.logs as string[]).length ? (e.data.logs as string[]).join('\n') : t('noOutput'),
        );
        setRunning(false);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [t]);

  const selectLesson = (id: string) => {
    setActiveId(id);
    setCode(getLesson(id)!.code);
    setOutput('');
  };

  const run = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    setRunning(true);
    setOutput(t('running'));
    win.postMessage({ type: 'run', code }, '*');
  };

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
      }) as React.CSSProperties,
    [mode],
  );

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="patterns"
      />
      <iframe
        ref={iframeRef}
        title="patterns-runner"
        sandbox="allow-scripts"
        srcDoc={RUNNER_SRCDOC}
        style={{ display: 'none' }}
      />
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={6}>
          <Card title={t('lessonsLabel')} className={styles.sectionCard} styles={{ body: { padding: 8 } }}>
            <div className={styles.generatedList}>
              {LESSONS.map((l) => (
                <div
                  key={l.id}
                  className={styles.generatedRow}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    background:
                      l.id === activeId ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : undefined,
                  }}
                  onClick={() => selectLesson(l.id)}
                >
                  <Text className={styles.generatedValue}>{t(`lessons.${l.id}.title`)}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title={t(`lessons.${activeId}.title`)}
            className={styles.sectionCard}
            styles={{ body: { padding: 16 } }}
          >
            <Space direction="vertical" size={12} className={styles.stackFull}>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {t(`lessons.${activeId}.explain`)}
                </ReactMarkdown>
              </div>
              <TextArea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoSize={{ minRows: 10, maxRows: 24 }}
                spellCheck={false}
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              />
              <Space wrap>
                <Button type="primary" icon={<CaretRightOutlined />} loading={running} onClick={run}>
                  {t('run')}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => selectLesson(activeId)}>
                  {t('resetCode')}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title={t('outputLabel')}
            className={styles.sectionCard}
            styles={{ body: { padding: 16 } }}
            extra={output ? <CopyButton value={output} /> : null}
          >
            {output ? (
              <pre
                data-testid="patterns-output"
                className={styles.codeBlock}
                style={{ whiteSpace: 'pre-wrap', margin: 0, minHeight: 80 }}
              >
                {output}
              </pre>
            ) : (
              <div className={styles.emptyPanel}>
                <Text>{t('outputEmpty')}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
