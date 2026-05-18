'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Input, Segmented, Space, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import {
  MERMAID_TEMPLATES,
  MERMAID_TEMPLATE_IDS,
  type MermaidTemplateId,
  svgFilename,
} from '@/lib/workbench/mermaid';
import { ToolHeader } from './ToolHeader';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;
const LS_KEY = 'hios-mermaid';

function safeRead(): string | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === 1 && typeof parsed.code === 'string' ? parsed.code : null;
  } catch {
    return null;
  }
}
function safeWrite(code: string) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify({ version: 1, code }));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

export function MermaidTool() {
  const t = useTranslations('Workbench.mermaid');
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [code, setCode] = useState(MERMAID_TEMPLATES.flowchart);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const param = searchParams.get('code');
    const stored = safeRead();
    if (param !== null) setCode(param);
    else if (stored) setCode(stored);
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('code', code);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
    safeWrite(code);
  }, [code, pathname, router, searchParams]);

  // Debounced client-only render. Mermaid is dynamically imported so it
  // never runs during SSR/build. securityLevel:'strict' = no scripts /
  // click handlers in diagrams; the SVG is sanitized, so injecting it via
  // dangerouslySetInnerHTML is safe here.
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: mode === 'dark' ? 'dark' : 'default',
        });
        await mermaid.parse(code);
        const { svg: out } = await mermaid.render(`mmd-${crypto.randomUUID()}`, code);
        if (!cancelled) {
          setSvg(out);
          setError('');
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('parseError'));
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [code, mode, t]);

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

  const exportSvg = useCallback(() => {
    if (!svg) return;
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = svgFilename(code.trim().split('\n')[0] ?? 'diagram');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      messageApi.error(t('exportError'));
    }
  }, [svg, code, messageApi, t]);

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="mermaid"
        actions={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={exportSvg} disabled={!svg}>
              {t('exportSvg')}
            </Button>
            <UrlPresets storageKey="mermaid" />
          </Space>
        }
      />
      <Card className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
        <Space direction="vertical" size={10} className={styles.stackFull}>
          <Text className={styles.metricLabel}>{t('templatesLabel')}</Text>
          <Segmented
            value={undefined}
            onChange={(v) => setCode(MERMAID_TEMPLATES[v as MermaidTemplateId])}
            options={MERMAID_TEMPLATE_IDS.map((id) => ({ label: t(`templates.${id}`), value: id }))}
          />
        </Space>
      </Card>
      <Card title={t('codeLabel')} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
        <TextArea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoSize={{ minRows: 8, maxRows: 22 }}
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
          spellCheck={false}
        />
      </Card>
      <Card
        title={t('previewLabel')}
        className={styles.sectionCard}
        styles={{ body: { padding: 16 } }}
        extra={error ? <Text type="danger">{t('invalid')}</Text> : null}
      >
        {svg ? (
          <div
            data-testid="mermaid-preview"
            style={{ overflowX: 'auto', textAlign: 'center' }}
            // Safe: mermaid securityLevel:'strict' sanitizes the SVG output.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className={styles.emptyPanel}>
            <Text>{t('empty')}</Text>
          </div>
        )}
        {error ? (
          <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
            {error}
          </pre>
        ) : null}
      </Card>
    </Space>
  );
}
