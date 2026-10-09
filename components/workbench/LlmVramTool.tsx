'use client';
import { ToolPresetBinding, textField, numberField } from '@/components/workbench/ToolPresetBinding';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Col, InputNumber, Row, Select, Space, Tag, Typography, Alert } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Title } = Typography;

const MODEL_PRESETS = [
  { params: 0.5, totalLayers: 24 },
  { params: 1.5, totalLayers: 28 },
  { params: 3.5, totalLayers: 32 },
  { params: 8, totalLayers: 33 },
  { params: 14, totalLayers: 48 },
  { params: 32, totalLayers: 64 },
  { params: 70, totalLayers: 80 },
];

const QUANT_BITS: Record<string, { bits: number }> = {
  Q4_K_M: { bits: 4.5 },
  Q5_K_M: { bits: 5.5 },
  Q8_0: { bits: 8.5 },
  FP16: { bits: 16.0 },
};

const KV_QUANT: Record<string, { bytesPerToken: number }> = {
  FP16: { bytesPerToken: 2.0 },
  Q8_0: { bytesPerToken: 1.0 },
  Q4_0: { bytesPerToken: 0.5 },
};

const VRAM_PRESETS = [
  { vram: 4 },
  { vram: 6 },
  { vram: 8 },
  { vram: 12 },
  { vram: 16 },
  { vram: 24 },
  { vram: 36 },
];

export function LlmVramTool() {
  const t = useTranslations('Workbench.vram');
  const [vram, setVram] = useState<number>(6);
  const [sysRam, setSysRam] = useState<number>(32);
  const [modelIndex, setModelIndex] = useState<number>(3); // 8B model default
  const [quantKey, setQuantKey] = useState<string>('Q4_K_M');
  const [contextTokens, setContextTokens] = useState<number>(8192);
  const [kvQuantKey, setKvQuantKey] = useState<string>('FP16');

  const selectedModel = MODEL_PRESETS[modelIndex];

  const calc = useMemo(() => {
    const bits = QUANT_BITS[quantKey].bits;
    const kvBytes = KV_QUANT[kvQuantKey].bytesPerToken;

    // Weight size in GB: (Params in Billions * bits per weight) / 8
    const weightSizeGb = (selectedModel.params * bits) / 8;

    // KV Cache Memory (approx): 2 * layers * hidden_dim * tokens * kv_quant_factor
    // Empirical formula: ~ 2.5MB per 1k tokens for 8B FP16
    const kvCacheGb = (contextTokens * selectedModel.params * 0.0003 * kvBytes) / 2.0;

    // CUDA Overhead: ~0.5 GB to 0.8 GB VRAM overhead for CUDA context
    const cudaOverheadGb = 0.6;

    const totalNeededGb = weightSizeGb + kvCacheGb;

    // VRAM available for weights after KV cache & CUDA overhead
    const vramForWeights = Math.max(0, vram - cudaOverheadGb - kvCacheGb);

    let offloadedLayers = 0;
    let vramStatus: 'full_gpu' | 'partial_gpu' | 'oom' = 'full_gpu';

    if (vramForWeights >= weightSizeGb) {
      offloadedLayers = selectedModel.totalLayers;
      vramStatus = 'full_gpu';
    } else if (vramForWeights > 0) {
      const ratio = vramForWeights / weightSizeGb;
      offloadedLayers = Math.floor(ratio * selectedModel.totalLayers);
      vramStatus = 'partial_gpu';
    } else {
      offloadedLayers = 0;
      vramStatus = 'oom';
    }

    const cpuRamNeededGb = totalNeededGb - (vramStatus === 'full_gpu' ? weightSizeGb : (offloadedLayers / selectedModel.totalLayers) * weightSizeGb);
    const systemRamExceeded = cpuRamNeededGb > sysRam;

    return {
      weightSizeGb,
      kvCacheGb,
      cudaOverheadGb,
      totalNeededGb,
      offloadedLayers,
      totalLayers: selectedModel.totalLayers,
      vramStatus,
      cpuRamNeededGb,
      systemRamExceeded,
    };
  }, [vram, sysRam, selectedModel, quantKey, contextTokens, kvQuantKey]);

  const llamaCliCmd = useMemo(() => {
    let cmd = `llama-cli -m model-${selectedModel.params}b-${quantKey.toLowerCase()}.gguf`;
    if (calc.offloadedLayers > 0) {
      cmd += ` -ngl ${calc.offloadedLayers}`;
    } else {
      cmd += ` -ngl 0`;
    }
    cmd += ` -c ${contextTokens}`;
    if (kvQuantKey !== 'FP16') {
      cmd += ` -ctk ${kvQuantKey.toLowerCase()} -ctv ${kvQuantKey.toLowerCase()}`;
    }
    cmd += ` --temp 0.7 -p "Your prompt here"`;
    return cmd;
  }, [selectedModel, quantKey, contextTokens, kvQuantKey, calc.offloadedLayers]);

  const ollamaCmd = useMemo(() => {
    return `# PowerShell example before starting Ollama:
$env:OLLAMA_NUM_PARALLEL="1"
$env:OLLAMA_FLASH_ATTENTION="1"

# API request with an example model; replace it with your installed model:
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "options": {
    "num_ctx": ${contextTokens},
    "num_gpu": ${calc.offloadedLayers}
  },
  "messages": [{"role": "user", "content": "Hello from local hardware"}]
}'`;
  }, [contextTokens, calc.offloadedLayers]);

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
      <ToolPresetBinding toolId="llm-vram-calc" fields={{ vram: numberField(vram, setVram, 1, 1024), sysRam: numberField(sysRam, setSysRam, 1, 4096), contextTokens: numberField(contextTokens, setContextTokens, 1, 1000000), modelIndex: numberField(modelIndex, setModelIndex, 0, MODEL_PRESETS.length - 1), quantKey: textField(quantKey, setQuantKey), kvQuantKey: textField(kvQuantKey, setKvQuantKey) }} />
      <ToolHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        locality="local"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t('hardwareTitle')} className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">{t('vram')}</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={vram}
                  onChange={setVram}
                  options={VRAM_PRESETS.map((p) => ({ label: `${p.vram} GB`, value: p.vram }))}
                />
              </div>

              <div>
                <Text type="secondary">{t('ram')}</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 6 }}
                  min={4}
                  max={256}
                  value={sysRam}
                  onChange={(v) => setSysRam(v || 16)}
                  addonAfter="GB RAM"
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('modelTitle')} className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">{t('model')}</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={modelIndex}
                  onChange={setModelIndex}
                  options={MODEL_PRESETS.map((m, idx) => ({ label: t('preset', { params: m.params, layers: m.totalLayers }), value: idx }))}
                />
              </div>

              <div>
                <Text type="secondary">{t('quant')}</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={quantKey}
                  onChange={setQuantKey}
                  options={Object.entries(QUANT_BITS).map(([k, quantInfo]) => ({ label: `${k} · ${quantInfo.bits} bit`, value: k }))}
                />
              </div>

              <div>
                <Text type="secondary">{t('context')}</Text>
                <Row gutter={8} style={{ marginTop: 6 }}>
                  <Col span={12}>
                    <Select
                      style={{ width: '100%' }}
                      value={contextTokens}
                      onChange={setContextTokens}
                      options={[
                        { label: '2,048 tokens', value: 2048 },
                        { label: '4,096 tokens', value: 4096 },
                        { label: '8,192 tokens', value: 8192 },
                        { label: '16,384 tokens', value: 16384 },
                        { label: '32,768 tokens', value: 32768 },
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <Select
                      style={{ width: '100%' }}
                      value={kvQuantKey}
                      onChange={setKvQuantKey}
                      options={Object.entries(KV_QUANT).map(([k, kvInfo]) => ({ label: t('kvOption', { format: k, factor: kvInfo.bytesPerToken }), value: k }))}
                    />
                  </Col>
                </Row>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t('resultTitle')} className={styles.cardSurface}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">{t('weight')}</Text>
              <Title level={3} style={{ margin: 0 }}>
                {calc.weightSizeGb.toFixed(2)} GB
              </Title>
              <Text style={{ fontSize: 12 }} type="secondary">
                {t('quantValue', { format: quantKey })}
              </Text>
            </Space>
          </Col>

          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">{t('cache', { tokens: contextTokens })}</Text>
              <Title level={3} style={{ margin: 0 }}>
                {calc.kvCacheGb.toFixed(2)} GB
              </Title>
              <Text style={{ fontSize: 12 }} type="secondary">
                {t('format', { format: kvQuantKey })}
              </Text>
            </Space>
          </Col>

          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">{t('offload')}</Text>
              <Title level={3} style={{ margin: 0, color: calc.vramStatus === 'full_gpu' ? '#22c55e' : calc.vramStatus === 'partial_gpu' ? '#eab308' : '#ef4444' }}>
                {t('layers', { count: calc.offloadedLayers, total: calc.totalLayers })}
              </Title>
              <Tag color={calc.vramStatus === 'full_gpu' ? 'green' : calc.vramStatus === 'partial_gpu' ? 'warning' : 'error'}>
                {t(calc.vramStatus === 'full_gpu' ? 'full' : calc.vramStatus === 'partial_gpu' ? 'partial' : 'cpu')}
              </Tag>
            </Space>
          </Col>
        </Row>

        {calc.vramStatus === 'partial_gpu' && (
          <Alert
            style={{ marginTop: 20 }}
            type="warning"
            showIcon
            message={t('partialTitle')}
            description={t('partialBody', { gpu: calc.offloadedLayers, total: calc.totalLayers, cpu: calc.totalLayers - calc.offloadedLayers, ram: calc.cpuRamNeededGb.toFixed(1) })}
          />
        )}

        {calc.vramStatus === 'oom' && (
          <Alert
            style={{ marginTop: 20 }}
            type="error"
            showIcon
            message={t('cpuTitle')}
            description={t('cpuBody', { total: calc.totalNeededGb.toFixed(1), ram: calc.cpuRamNeededGb.toFixed(1) })}
          />
        )}

        {calc.systemRamExceeded && (
          <Alert
            style={{ marginTop: 20 }}
            type="error"
            showIcon
            message={t('ramTitle')}
            description={t('ramBody', { needed: calc.cpuRamNeededGb.toFixed(1), available: sysRam })}
          />
        )}
      </Card>

      <Card title={t('commandsTitle')} className={styles.cardSurface}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>{t('cli')}</Text>
              <CopyButton value={llamaCliCmd} />
            </div>
            <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
              {llamaCliCmd}
            </pre>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>{t('ollama')}</Text>
              <CopyButton value={ollamaCmd} />
            </div>
            <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
              {ollamaCmd}
            </pre>
          </div>
        </Space>
      </Card>

      <Card title={t('scopeTitle')} className={styles.cardSurface}>
        <Typography.Paragraph style={{ margin: 0 }}>
          {t('scope')}
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
