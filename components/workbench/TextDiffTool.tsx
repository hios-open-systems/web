'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Col, Input, Row, Space, Tag, Typography } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { diffLines } from '@/lib/workbench/textDiff';
import { ToolHeader } from './ToolHeader';
import { CopyButton } from './CopyButton';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE_A = 'function greet(name) {\n  return "Hi " + name;\n}\nexport default greet;';
const EXAMPLE_B = 'function greet(name) {\n  return `Hello, ${name}`;\n}\nexport default greet;';

export function TextDiffTool() {
  const t = useTranslations('Workbench.textDiff');
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);

  const [a, setA] = useState(EXAMPLE_A);
  const [b, setB] = useState(EXAMPLE_B);

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const pa = searchParams.get('a');
    const pb = searchParams.get('b');
    if (pa !== null) setA(pa);
    if (pb !== null) setB(pb);
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('a', a);
    params.set('b', b);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [a, b, pathname, router, searchParams]);

  const diff = useMemo(() => diffLines(a, b), [a, b]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
      }) as React.CSSProperties,
    [mode],
  );

  const colors: Record<string, string> = {
    add: mode === 'dark' ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.14)',
    del: mode === 'dark' ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.12)',
    eq: 'transparent',
  };
  const sign: Record<string, string> = { add: '+', del: '-', eq: ' ' };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="textDiff"
        actions={
          <Space wrap>
            <Tag color="green">+{diff.added}</Tag>
            <Tag color="red">-{diff.removed}</Tag>
            <UrlPresets storageKey="text-diff" />
          </Space>
        }
      />
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card title={t('leftLabel')} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
            <TextArea value={a} onChange={(e) => setA(e.target.value)} autoSize={{ minRows: 6, maxRows: 18 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('rightLabel')} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
            <TextArea value={b} onChange={(e) => setB(e.target.value)} autoSize={{ minRows: 6, maxRows: 18 }} />
          </Card>
        </Col>
      </Row>
      <Card
        title={t('diffLabel')}
        className={styles.sectionCard}
        styles={{ body: { padding: 0 } }}
        extra={
          <Space>
            {diff.truncated ? <Tag color="orange">{t('truncated')}</Tag> : null}
            {diff.added || diff.removed ? (
              <CopyButton
                value={() =>
                  diff.lines
                    .map((l) => (l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' ') + l.value)
                    .join('\n')
                }
              />
            ) : null}
          </Space>
        }
      >
        {diff.added === 0 && diff.removed === 0 ? (
          <div className={styles.emptyPanel}>
            <Text>{t('identical')}</Text>
          </div>
        ) : (
          <pre style={{ margin: 0, padding: 16, overflowX: 'auto', fontSize: 13, lineHeight: 1.55 }}>
            {diff.lines.map((ln, idx) => (
              <div
                key={idx}
                style={{ background: colors[ln.type], whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                <span style={{ opacity: 0.5, userSelect: 'none' }}>{sign[ln.type]} </span>
                {ln.value || ' '}
              </div>
            ))}
          </pre>
        )}
      </Card>
    </Space>
  );
}
