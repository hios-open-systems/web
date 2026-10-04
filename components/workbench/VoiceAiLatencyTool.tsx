'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, Col, Progress, Row, Select, Space, Tag, Typography } from 'antd';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Title, Paragraph } = Typography;

const VAD_OPTIONS = [200, 350, 500];

const STT_OPTIONS = [120, 220, 850, 280];

const LLM_OPTIONS = [90, 160, 1200, 180, 550];

const TTS_OPTIONS = [70, 180, 320, 850];

const NETWORK_OPTIONS = [0, 15, 45, 160];

export function VoiceAiLatencyTool() {
  const t = useTranslations('Workbench.voiceLatency');
  const scenarioOptions = (values: number[]) => values.map(value => ({ value, label: t('scenario', { ms: value }) }));
  const [vadMs, setVadMs] = useState<number>(200);
  const [sttMs, setSttMs] = useState<number>(120);
  const [llmMs, setLlmMs] = useState<number>(160);
  const [ttsMs, setTtsMs] = useState<number>(70);
  const [netMs, setNetMs] = useState<number>(15);

  const [simulating, setSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simStage, setSimStage] = useState<string>('');

  const totalMs = useMemo(() => {
    return vadMs + sttMs + llmMs + ttsMs + netMs;
  }, [vadMs, sttMs, llmMs, ttsMs, netMs]);

  const rating = useMemo(() => {
    if (totalMs < 500) {
      return {
        label: 'ratingFast',
        color: 'green',
        desc: 'hintFast',
      };
    }
    if (totalMs < 900) {
      return {
        label: 'ratingMedium',
        color: 'blue',
        desc: 'hintMedium',
      };
    }
    if (totalMs < 1600) {
      return {
        label: 'ratingSlow',
        color: 'orange',
        desc: 'hintSlow',
      };
    }
    return {
      label: 'ratingLong',
      color: 'red',
      desc: 'hintLong',
    };
  }, [totalMs]);

  const startSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    setSimProgress(0);

    const stages = [
      { name: 'stageVad', duration: vadMs },
      { name: 'stageStt', duration: sttMs },
      { name: 'stageNetwork', duration: netMs },
      { name: 'stageLlm', duration: llmMs },
      { name: 'stageTts', duration: ttsMs },
    ];

    let current = 0;
    const runStage = (index: number) => {
      if (index >= stages.length) {
        setSimStage('done');
        setSimProgress(100);
        setTimeout(() => setSimulating(false), 800);
        return;
      }
      const st = stages[index];
      setSimStage(st.name);
      current += st.duration;
      setSimProgress(Math.min(95, Math.round((current / totalMs) * 100)));
      setTimeout(() => runStage(index + 1), st.duration);
    };

    runStage(0);
  };

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

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t('inputTitle')} className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">{t('vad')}</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={vadMs} onChange={setVadMs} options={scenarioOptions(VAD_OPTIONS)} />
              </div>
              <div>
                <Text type="secondary">{t('stt')}</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={sttMs} onChange={setSttMs} options={scenarioOptions(STT_OPTIONS)} />
              </div>
              <div>
                <Text type="secondary">{t('network')}</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={netMs} onChange={setNetMs} options={scenarioOptions(NETWORK_OPTIONS)} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('outputTitle')} className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">{t('llm')}</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={llmMs} onChange={setLlmMs} options={scenarioOptions(LLM_OPTIONS)} />
              </div>
              <div>
                <Text type="secondary">{t('tts')}</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={ttsMs} onChange={setTtsMs} options={scenarioOptions(TTS_OPTIONS)} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t('totalTitle')} className={styles.cardSurface}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">{t('total')}</Text>
              <Title level={2} style={{ margin: 0, color: rating.color === 'green' ? '#22c55e' : rating.color === 'blue' ? '#3b82f6' : rating.color === 'orange' ? '#f59e0b' : '#ef4444' }}>
                {totalMs} ms
              </Title>
              <Tag color={rating.color}>{t(rating.label)}</Tag>
            </Space>
          </Col>

          <Col xs={24} sm={16}>
            <Paragraph style={{ margin: 0 }}>{t(rating.desc)}</Paragraph>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>VAD ({vadMs}ms)</span>
                <span>STT ({sttMs}ms)</span>
                <span>{t('networkShort')} ({netMs}ms)</span>
                <span>LLM ({llmMs}ms)</span>
                <span>TTS ({ttsMs}ms)</span>
              </div>
              <Progress
                percent={100}
                success={{ percent: Math.round(((vadMs + sttMs) / totalMs) * 100) }}
                showInfo={false}
                strokeColor="#a855f7"
              />
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--hios-border)' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" onClick={startSimulation} loading={simulating}>
              {t(simulating ? 'running' : 'run')}
            </Button>
            {simulating && (
              <div style={{ marginTop: 12 }}>
                <Text strong>{t(simStage)}</Text>
                <Progress percent={simProgress} status="active" />
              </div>
            )}
          </Space>
        </div>
      </Card>

      <Card title={t('scopeTitle')} className={styles.cardSurface}>
        <Paragraph style={{ margin: 0 }}>
          {t('scope')}
          <br /><br />
          {t('streaming')}
          <br /><br />
          {t('tuning')}
        </Paragraph>
      </Card>
    </Space>
  );
}
