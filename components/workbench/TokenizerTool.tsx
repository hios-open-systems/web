'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, Col, Input, Row, Select, Space, Typography } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Title, Paragraph } = Typography;

const PRESETS = [
  {
    name: 'presetEs',
    text: 'Configura el pin GPIO 4 del ESP32 como entrada con resistencia pull-up interna y reporta cada 500 milisegundos.',
  },
  {
    name: 'presetEn',
    text: 'Configure ESP32 pin GPIO 4 as an input with internal pull-up resistor and report every 500 milliseconds.',
  },
  {
    name: 'presetCpp',
    text: 'struct __attribute__((packed)) TelemetryPacket {\n  uint32_t timestamp;\n  float temperature_c;\n  uint8_t battery_level;\n};',
  },
  {
    name: 'presetJson',
    text: '{"action": "turn_on", "device": "desk_lamp", "brightness_pct": 85, "fade_ms": 300}',
  },
];

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
];

// Illustrative heuristic; this is not a model tokenizer.
function tokenizeText(input: string): string[] {
  if (!input) return [];
  // Tokenize regex que emula el regex de tokenización de GPT/Llama:
  // Palabras, contracciones, números, espacios y signos
  const regex = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
  const matches = input.match(regex);
  if (!matches) return [input];

  // Para palabras largas o compuestas no inglesas, simular subwords de BPE (partir en fragmentos de 3-4 chars)
  const tokens: string[] = [];
  for (const m of matches) {
    if (m.length > 5 && /\p{L}/u.test(m)) {
      // Subword split
      for (let i = 0; i < m.length; i += 4) {
        tokens.push(m.slice(i, i + 4));
      }
    } else {
      tokens.push(m);
    }
  }
  return tokens;
}

export function TokenizerTool() {
  const t = useTranslations('Workbench.tokenEstimator');
  const [text, setText] = useState<string>(PRESETS[0].text);
  const [modelType, setModelType] = useState<string>('llama3');

  const tokens = useMemo(() => {
    return tokenizeText(text);
  }, [text]);

  const stats = useMemo(() => {
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const count = tokens.length;
    const ratio = words > 0 ? (count / words).toFixed(2) : '0';
    // Fixed coefficient for an illustrative calculation, not a KV-cache estimate.
    const kvMemoryKb = Math.round(count * 0.52);

    return { chars, words, count, ratio, kvMemoryKb };
  }, [text, tokens]);

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

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      <ToolHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        locality="local"
      />

      <Card title={t('inputTitle')} className={styles.cardSurface}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <Button size="small" key={t(p.name)} onClick={() => setText(p.text)}>
                {p.name}
              </Button>
            ))}
          </div>

          <Input.TextArea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
          />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Text type="secondary">{t('modelReference')}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={modelType}
                onChange={setModelType}
                options={[
                  { label: 'Llama 3.x', value: 'llama3' },
                  { label: 'Qwen 2.5', value: 'qwen' },
                  { label: 'GPT / Llama 2', value: 'legacy' },
                ]}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title={t('metricsTitle')} className={styles.cardSurface}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">{t('fragments')}</Text>
                <Title level={2} style={{ margin: 0, color: '#3b82f6' }}>
                  {stats.count}
                </Title>
              </div>
              <Row gutter={8}>
                <Col span={12}>
                  <Text type="secondary">{t('words')}</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.words}
                  </Title>
                </Col>
                <Col span={12}>
                  <Text type="secondary">{t('characters')}</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.chars}
                  </Title>
                </Col>
              </Row>
              <div>
                <Text type="secondary">{t('ratio')}</Text>
                <Title level={4} style={{ margin: 0, color: Number(stats.ratio) > 1.5 ? '#f59e0b' : '#22c55e' }}>
                  {stats.ratio}
                </Title>
                <Text style={{ fontSize: 12 }} type="secondary">
                  {t('ratioHint')}
                </Text>
              </div>
              <div>
                <Text type="secondary">{t('memory')}</Text>
                <Title level={4} style={{ margin: 0 }}>
                  ~{stats.kvMemoryKb} KB
                </Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span>{t('visualTitle', { count: stats.count })}</span>
                <CopyButton value={JSON.stringify(tokens, null, 2)} />
              </div>
            }
            className={styles.cardSurface}
          >
            <div
              style={{
                background: 'var(--hios-bg-secondary)',
                padding: 16,
                borderRadius: 8,
                minHeight: 180,
                maxHeight: 320,
                overflowY: 'auto',
                lineHeight: 2,
              }}
            >
              {tokens.length === 0 ? (
                <Text type="secondary">{t('empty')}</Text>
              ) : (
                tokens.map((tok, idx) => {
                  const color = COLORS[idx % COLORS.length];
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: `${color}20`,
                        borderBottom: `2px solid ${color}`,
                        color: 'var(--hios-text-primary)',
                        fontFamily: 'var(--font-stack-mono)',
                        fontSize: 13,
                        padding: '2px 4px',
                        margin: '2px 3px',
                        borderRadius: 3,
                        whiteSpace: 'pre-wrap',
                      }}
                      title={t('fragmentHint', { index: idx + 1, text: tok, count: tok.length })}
                    >
                      {tok}
                    </span>
                  );
                })
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title={t('scopeTitle')} className={styles.cardSurface}>
        <Paragraph style={{ margin: 0 }}>
          {t('scope')}
        </Paragraph>
      </Card>
    </Space>
  );
}
