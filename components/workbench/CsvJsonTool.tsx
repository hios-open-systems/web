'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Segmented, Select, Space, Switch, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { csvToObjects, objectsToCsv, parseCsv, toCsv } from '@/lib/workbench/csvJson';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

type Direction = 'toJson' | 'toCsv';

const EXAMPLE_CSV = 'name,age,city\nJuan,30,"Buenos Aires"\nAna,25,Córdoba';

const DELIMITERS = [
  { label: 'Comma ,', value: ',' },
  { label: 'Semicolon ;', value: ';' },
  { label: 'Tab \\t', value: '\t' },
  { label: 'Pipe |', value: '|' },
];

export function CsvJsonTool() {
  const t = useTranslations('Workbench.csvJson');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();

  const [direction, setDirection] = useState<Direction>('toJson');
  const [csvText, setCsvText] = useState(EXAMPLE_CSV);
  const [jsonText, setJsonText] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [header, setHeader] = useState(true);

  const output = useMemo(() => {
    try {
      if (direction === 'toJson') {
        if (!csvText.trim()) return { value: '' };
        const data = header ? csvToObjects(csvText, delimiter) : parseCsv(csvText, delimiter);
        return { value: JSON.stringify(data, null, 2) };
      }
      if (!jsonText.trim()) return { value: '' };
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) return { error: true };
      if (parsed.every((r) => Array.isArray(r))) {
        return { value: toCsv(parsed as string[][], delimiter) };
      }
      return { value: objectsToCsv(parsed as Record<string, unknown>[], delimiter) };
    } catch {
      return { error: true };
    }
  }, [direction, csvText, jsonText, delimiter, header]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
      }) as React.CSSProperties,
    [mode],
  );

  const sourceLabel = direction === 'toJson' ? t('csvLabel') : t('jsonLabel');
  const outputLabel = direction === 'toJson' ? t('jsonLabel') : t('csvLabel');
  const sourceValue = direction === 'toJson' ? csvText : jsonText;
  const setSource = direction === 'toJson' ? setCsvText : setJsonText;

  const copy = async () => {
    if (!('value' in output) || !output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      messageApi.success(t('copied'));
    } catch {
      messageApi.error(t('copyError'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="csvJson"
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
        <Space wrap size={16}>
          <Segmented
            value={direction}
            onChange={(v) => setDirection(v as Direction)}
            options={[
              { label: t('toJson'), value: 'toJson' },
              { label: t('toCsv'), value: 'toCsv' },
            ]}
          />
          <Space size={8} align="center">
            <Text className={styles.metricLabel}>{t('delimiterLabel')}</Text>
            <Select value={delimiter} onChange={setDelimiter} options={DELIMITERS} style={{ width: 140 }} />
          </Space>
          <Space size={8} align="center">
            <Text className={styles.metricLabel}>{t('headerLabel')}</Text>
            <Switch checked={header} onChange={setHeader} />
          </Space>
        </Space>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title={sourceLabel} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
          <TextArea
            value={sourceValue}
            onChange={(e) => setSource(e.target.value)}
            autoSize={{ minRows: 10, maxRows: 22 }}
            placeholder={direction === 'toJson' ? t('csvPlaceholder') : t('jsonPlaceholder')}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Card>
        <Card
          title={outputLabel}
          className={styles.sectionCard}
          styles={{ body: { padding: 16 } }}
          extra={
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={copy} disabled={!('value' in output) || !output.value} />
          }
        >
          {'error' in output ? (
            <Text type="danger">{t('error')}</Text>
          ) : (
            <pre
              className={styles.codeBlock}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, minHeight: 220 }}
            >
              {output.value}
            </pre>
          )}
        </Card>
      </div>
    </Space>
  );
}
