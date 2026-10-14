'use client';
import { ToolPresetBinding, textField, numberField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

import { BASES, type Base, parseAny, toBase } from '@/lib/workbench/numberBase';
import { NumberBaseResults } from './NumberBaseResults';

// ── Component ─────────────────────────────────────────────────────────────────

export function NumberBaseTool() {
  const t = useTranslations('Workbench.numberBase');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();

  const [activeBase, setActiveBase] = useState<Base>(10);
  const [inputVal, setInputVal] = useState('255');

  const parsed = useMemo(() => parseAny(inputVal, activeBase), [inputVal, activeBase]);
  const value = parsed.valid && parsed.value !== undefined ? parsed.value : null;

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const copyVal = useCopyToClipboard(messageApi);

  const switchTo = (base: Base) => {
    if (value !== null) {
      setInputVal(toBase(value, base));
    }
    setActiveBase(base);
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolPresetBinding toolId="number-base" fields={{ inputVal: textField(inputVal, setInputVal), activeBase: numberField(activeBase, value => { if (value === 2 || value === 8 || value === 10 || value === 16) setActiveBase(value); }, 2, 16) }} />
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={14} className={styles.stackFull}>
          <Row gutter={[12, 12]}>
            {BASES.map(({ base, label }) => (
              <Col key={base} xs={12} sm={6}>
                <Button
                  block
                  type={activeBase === base ? 'primary' : 'default'}
                  onClick={() => switchTo(base)}
                  icon={<SwapOutlined />}
                >
                  {label}
                </Button>
              </Col>
            ))}
          </Row>
          <Input
            aria-label={t('inputPlaceholder')}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('inputPlaceholder')}
            style={{ fontFamily: 'monospace', fontSize: 18 }}
            status={inputVal && !parsed.valid ? 'error' : undefined}
            addonBefore={
              <Text style={{ fontFamily: 'monospace', color: 'var(--wb-text-muted)', minWidth: 24 }}>
                {BASES.find((b) => b.base === activeBase)?.prefix ?? ''}
              </Text>
            }
          />
          {inputVal && !parsed.valid && <Text type="danger">{t('invalid')}</Text>}
        </Space>
      </Card>

      {value !== null && <NumberBaseResults value={value} activeBase={activeBase} mode={mode} switchTo={switchTo} copyVal={copyVal} />}
    </Space>
  );
}
