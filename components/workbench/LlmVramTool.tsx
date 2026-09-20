'use client';

import React, { useMemo, useState } from 'react';
import { Card, Col, InputNumber, Row, Select, Space, Tag, Typography, Alert } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Title } = Typography;

const MODEL_PRESETS = [
  { label: 'SmolLM2 / Qwen 0.5B', params: 0.5, totalLayers: 24 },
  { label: 'Qwen2.5 1.5B', params: 1.5, totalLayers: 28 },
  { label: 'Llama 3.2 3B / Phi-3.5', params: 3.5, totalLayers: 32 },
  { label: 'Llama 3.1 8B / Qwen2.5 7B (Sweet Spot)', params: 8, totalLayers: 33 },
  { label: 'Phi-4 / Qwen2.5 14B', params: 14, totalLayers: 48 },
  { label: 'Qwen2.5 32B / DeepSeek 33B', params: 32, totalLayers: 64 },
  { label: 'Llama 3.1 70B / Qwen 72B', params: 70, totalLayers: 80 },
];

const QUANT_BITS: Record<string, { bits: number; desc: string }> = {
  Q4_K_M: { bits: 4.5, desc: '4-bit Mixed (Recomendado: balance óptimo calidad/memoria)' },
  Q5_K_M: { bits: 5.5, desc: '5-bit Mixed (Mayor precisión, +20% memoria)' },
  Q8_0: { bits: 8.5, desc: '8-bit Int (Casi idéntico a FP16, requiere el doble de VRAM)' },
  FP16: { bits: 16.0, desc: '16-bit Float (Sin cuantizar, peso completo)' },
};

const KV_QUANT: Record<string, { bytesPerToken: number; desc: string }> = {
  FP16: { bytesPerToken: 2.0, desc: 'FP16 (Caché KV nativo completo)' },
  Q8_0: { bytesPerToken: 1.0, desc: 'Q8_0 (Ahorra 50% de memoria KV)' },
  Q4_0: { bytesPerToken: 0.5, desc: 'Q4_0 (Ahorra 75% de memoria KV)' },
};

const VRAM_PRESETS = [
  { label: '4 GB VRAM (GTX 1650 / RX 6500)', vram: 4 },
  { label: '6 GB VRAM (RTX 2060 / 3050)', vram: 6 },
  { label: '8 GB VRAM (RTX 3060 / 4060 / Mac M1-M3 8G)', vram: 8 },
  { label: '12 GB VRAM (RTX 3060 12G / 4070)', vram: 12 },
  { label: '16 GB VRAM (RTX 4080 / Mac 16G)', vram: 16 },
  { label: '24 GB VRAM (RTX 3090 / 4090)', vram: 24 },
  { label: '36 GB / 64 GB Unified (Mac Studio / M-Max)', vram: 36 },
];

export function LlmVramTool() {
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
    cmd += ` --temp 0.7 -p "Tu prompt aquí"`;
    return cmd;
  }, [selectedModel, quantKey, contextTokens, kvQuantKey, calc.offloadedLayers]);

  const ollamaCmd = useMemo(() => {
    return `# En terminal antes de iniciar Ollama:
$env:OLLAMA_NUM_PARALLEL="1"
$env:OLLAMA_FLASH_ATTENTION="1"

# API Call con context window ajustado:
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "options": {
    "num_ctx": ${contextTokens},
    "num_gpu": ${calc.offloadedLayers}
  },
  "messages": [{"role": "user", "content": "Hola desde hardware local"}]
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
      <ToolHeader
        eyebrow="IA Local & VRAM"
        title="Calculadora de VRAM para LLMs Locales"
        description="Calcula exactamente cuánta VRAM y RAM necesitas para correr un modelo cuantizado en llama.cpp o Ollama sin sufrir caídas por Out-Of-Memory."
        locality="local"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="1. Configuración de Hardware" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">GPU VRAM disponible:</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={vram}
                  onChange={setVram}
                  options={VRAM_PRESETS.map((p) => ({ label: p.label, value: p.vram }))}
                />
              </div>

              <div>
                <Text type="secondary">RAM de Sistema (DDR4/DDR5):</Text>
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
          <Card title="2. Parámetros del Modelo LLM" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">Modelo y Tamaño (Billones de parámetros):</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={modelIndex}
                  onChange={setModelIndex}
                  options={MODEL_PRESETS.map((m, idx) => ({ label: m.label, value: idx }))}
                />
              </div>

              <div>
                <Text type="secondary">Cuantización de Pesos (GGUF):</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={quantKey}
                  onChange={setQuantKey}
                  options={Object.entries(QUANT_BITS).map(([k, quantInfo]) => ({ label: `${k} - ${quantInfo.desc}`, value: k }))}
                />
              </div>

              <div>
                <Text type="secondary">Context Window (Tokens) y Caché KV:</Text>
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
                      options={Object.entries(KV_QUANT).map(([k, kvInfo]) => ({ label: `Caché KV: ${k} (${kvInfo.desc})`, value: k }))}
                    />
                  </Col>
                </Row>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="3. Diagnóstico de Memoria y GPU Offloading" className={styles.cardSurface}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">Peso del Modelo en Disco/RAM:</Text>
              <Title level={3} style={{ margin: 0 }}>
                {calc.weightSizeGb.toFixed(2)} GB
              </Title>
              <Text style={{ fontSize: 12 }} type="secondary">
                Cuantización {quantKey}
              </Text>
            </Space>
          </Col>

          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">Memoria para Caché KV ({contextTokens} tokens):</Text>
              <Title level={3} style={{ margin: 0 }}>
                {calc.kvCacheGb.toFixed(2)} GB
              </Title>
              <Text style={{ fontSize: 12 }} type="secondary">
                Formato {kvQuantKey}
              </Text>
            </Space>
          </Col>

          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">Offload a GPU VRAM (`-ngl`):</Text>
              <Title level={3} style={{ margin: 0, color: calc.vramStatus === 'full_gpu' ? '#22c55e' : calc.vramStatus === 'partial_gpu' ? '#eab308' : '#ef4444' }}>
                {calc.offloadedLayers} / {calc.totalLayers} capas
              </Title>
              <Tag color={calc.vramStatus === 'full_gpu' ? 'green' : calc.vramStatus === 'partial_gpu' ? 'warning' : 'error'}>
                {calc.vramStatus === 'full_gpu' ? '100% GPU VRAM (Máxima velocidad)' : calc.vramStatus === 'partial_gpu' ? 'Inferencia Híbrida GPU + CPU' : 'OOM: Todo va por CPU (Lento)'}
              </Tag>
            </Space>
          </Col>
        </Row>

        {calc.vramStatus === 'partial_gpu' && (
          <Alert
            style={{ marginTop: 20 }}
            type="warning"
            showIcon
            message="Inferencia Híbrida detectada"
            description={`Tu VRAM de ${vram}GB puede albergar ${calc.offloadedLayers} de las ${calc.totalLayers} capas del modelo. Las capas restantes (${calc.totalLayers - calc.offloadedLayers}) correrán en la CPU y RAM del sistema (${calc.cpuRamNeededGb.toFixed(1)} GB).`}
          />
        )}

        {calc.vramStatus === 'oom' && (
          <Alert
            style={{ marginTop: 20 }}
            type="error"
            showIcon
            message="Insuficiente VRAM para aceleración GPU"
            description={`El modelo y el caché KV requieren ${calc.totalNeededGb.toFixed(1)} GB. Todo el modelo se cargará en la RAM del sistema (${calc.cpuRamNeededGb.toFixed(1)} GB). Te recomendamos achicar el context window o usar una cuantización menor (ej. Q4_K_M).`}
          />
        )}

        {calc.systemRamExceeded && (
          <Alert
            style={{ marginTop: 20 }}
            type="error"
            showIcon
            message="CRÍTICO: Desborde de RAM de Sistema"
            description={`Se requieren ${calc.cpuRamNeededGb.toFixed(1)} GB de RAM pero solo tienes ${sysRam} GB. Tu sistema sufrirá intercambio por disco (swap) y la inferencia se arrastrará o crasheará.`}
          />
        )}
      </Card>

      <Card title="4. Comandos Generados para Inferencia" className={styles.cardSurface}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Comando llama.cpp CLI:</Text>
              <CopyButton value={llamaCliCmd} />
            </div>
            <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
              {llamaCliCmd}
            </pre>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Configuración / API Call para Ollama:</Text>
              <CopyButton value={ollamaCmd} />
            </div>
            <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
              {ollamaCmd}
            </pre>
          </div>
        </Space>
      </Card>

      <Card title="5. Fórmulas de Memoria y Optimización" className={styles.cardSurface}>
        <Typography.Paragraph style={{ margin: 0 }}>
          La memoria de weights se calcula como <code>(Parámetros × Bits) / 8</code>. El caché KV almacena las claves y valores de atención para cada token del contexto histórico. La flag <code>-ngl</code> indica cuántas capas neuronales se transfieren a la VRAM de la placa de video mediante CUDA o Vulkan. Usar cuantización de caché KV (<code>-ctk q8_0 -ctv q8_0</code>) reduce el consumo del buffer de contexto a la mitad sin degradación apreciable de razonamiento.
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
