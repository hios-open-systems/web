'use client';
import { ToolPresetBinding, textField, booleanField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Button, Card, Input, Segmented, Select, Space, Switch, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { csvToObjects, jsonToCsv, parseCsv } from '@/lib/workbench/csvJson';
import { downloadBlob } from '@/lib/workbench/download';
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
      return { value: jsonToCsv(parsed, delimiter) };
    } catch {
      return { error: true };
    }
  }, [direction, csvText, jsonText, delimiter, header]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const sourceLabel = direction === 'toJson' ? t('csvLabel') : t('jsonLabel');
  const outputLabel = direction === 'toJson' ? t('jsonLabel') : t('csvLabel');
  const sourceValue = direction === 'toJson' ? csvText : jsonText;
  const setSource = direction === 'toJson' ? setCsvText : setJsonText;

  const copyToClipboard = useCopyToClipboard(messageApi);
  const copy = () => {
    if (!('value' in output) || !output.value) return;
    void copyToClipboard(output.value);
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolPresetBinding toolId="csv-json" fields={{ header: booleanField(header, setHeader), csvText: textField(csvText, setCsvText), jsonText: textField(jsonText, setJsonText), delimiter: textField(delimiter, setDelimiter), direction: textField(direction, setDirection, ['toJson', 'toCsv'], false) }} />
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
            onChange={(v) => {
              if (output.value) (v === 'toCsv' ? setJsonText : setCsvText)(output.value);
              setDirection(v as Direction);
            }}
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
            <Switch aria-label={t('headerLabel')} checked={header} onChange={setHeader} disabled={direction === 'toCsv'} />
          </Space>
        </Space>
      </Card>

      <div className={styles.editorGrid}>
        <Card title={sourceLabel} className={styles.sectionCard} styles={{ body: { padding: 16 } }}>
          <TextArea
            aria-label={sourceLabel}
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
        >
          <Space wrap style={{ marginBottom: 12 }}>
            <Button size="large" icon={<CopyOutlined aria-hidden />} onClick={copy} disabled={!output.value}>{t('copy')}</Button>
            <Button size="large" icon={<DownloadOutlined aria-hidden />} disabled={!output.value} onClick={() => downloadBlob(output.value ?? '', direction === 'toJson' ? 'data.json' : 'data.csv', direction === 'toJson' ? 'application/json' : 'text/csv;charset=utf-8')}>{t('download')}</Button>
          </Space>
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
