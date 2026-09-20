'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Progress, Row, Select, Space, Tag, Typography } from 'antd';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Title, Paragraph } = Typography;

const VAD_OPTIONS = [
  { label: 'Silero VAD Optimizado (200 ms silencio)', value: 200 },
  { label: 'WebRTC VAD Estándar (350 ms silencio)', value: 350 },
  { label: 'VAD Conservador / Ruido ambiente (500 ms silencio)', value: 500 },
];

const STT_OPTIONS = [
  { label: 'Whisper.cpp Tiny (GPU Offload - ~120 ms)', value: 120 },
  { label: 'Whisper.cpp Base (GPU Offload - ~220 ms)', value: 220 },
  { label: 'Whisper.cpp Small (CPU Only - ~850 ms)', value: 850 },
  { label: 'Cloud STT API (Deepgram / Groq - ~280 ms)', value: 280 },
];

const LLM_OPTIONS = [
  { label: 'Llama 3.2 3B / Qwen 1.5B (GPU Local - TTFT ~90 ms)', value: 90 },
  { label: 'Llama 3.1 8B Q4 (GPU Local - TTFT ~160 ms)', value: 160 },
  { label: 'Llama 3.1 8B Q4 (CPU System RAM - TTFT ~1,200 ms)', value: 1200 },
  { label: 'Cloud Fast API (Groq / Cerebras - TTFT ~180 ms)', value: 180 },
  { label: 'Cloud Standard API (OpenAI / Claude - TTFT ~550 ms)', value: 550 },
];

const TTS_OPTIONS = [
  { label: 'Piper TTS C++ (Local Streaming - ~70 ms primer audio)', value: 70 },
  { label: 'Kokoro / MeloTTS (Local ONNX - ~180 ms)', value: 180 },
  { label: 'Cloud Streaming TTS (Cartesia / ElevenLabs - ~320 ms)', value: 320 },
  { label: 'Cloud Batch TTS (TTS estándar sin streaming - ~850 ms)', value: 850 },
];

const NETWORK_OPTIONS = [
  { label: 'Pure Localhost (ESP32 conectado o app local - 0 ms)', value: 0 },
  { label: 'WiFi LAN Local (ESP32 ↔ PC Servidor Ollama - 15 ms)', value: 15 },
  { label: 'Internet / WAN (Fibra óptica nacional - 45 ms)', value: 45 },
  { label: 'Internet / WAN Internacional (EE.UU. / Europa - 160 ms)', value: 160 },
];

export function VoiceAiLatencyTool() {
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
        label: 'Conversación Humana Fluida',
        color: 'green',
        desc: 'Excelente. La latencia se percibe como natural e instantánea, emulando el ritmo de diálogo humano real.',
      };
    }
    if (totalMs < 900) {
      return {
        label: 'Pausa Aceptable (Tipo Walkie-Talkie)',
        color: 'blue',
        desc: 'Buena para comandos o consultas puntuales, pero se nota un leve retraso en conversaciones dinámicas continuas.',
      };
    }
    if (totalMs < 1600) {
      return {
        label: 'Latencia Molesta (Pausa Larga)',
        color: 'orange',
        desc: 'El usuario percibe una espera artificial prolongada. Tiende a dudar si el sistema escuchó su mensaje.',
      };
    }
    return {
      label: 'Crítico: Inusable para Voz Fluida',
      color: 'red',
      desc: 'Retraso de llamada satelital. Provoca colisiones de habla e interrupciones constantes.',
    };
  }, [totalMs]);

  const startSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    setSimProgress(0);

    const stages = [
      { name: '1. Detectando fin de habla (VAD)...', duration: vadMs },
      { name: '2. Transcribiendo audio (STT Whisper)...', duration: sttMs },
      { name: '3. Red local (Transporte LAN)...', duration: netMs },
      { name: '4. Generando primer token (LLM TTFT)...', duration: llmMs },
      { name: '5. Sintetizando voz (TTS Audio)...', duration: ttsMs },
    ];

    let current = 0;
    const runStage = (index: number) => {
      if (index >= stages.length) {
        setSimStage('¡Audio reproduciendo en el parlante!');
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
        eyebrow="Human Interfaces & Voice AI"
        title="Calculadora de Latencia de Interfaz de Voz Humano-IA"
        description="Calcula la latencia extremo a extremo (End-to-End) en la interacción conversacional por voz: VAD + Reconocimiento + Inferencia LLM + Síntesis de Audio."
        locality="local"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="1. Parámetros de Audio de Entrada (Entrada Humana)" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">VAD (Voice Activity Detection / Fin de Habla):</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={vadMs} onChange={setVadMs} options={VAD_OPTIONS} />
              </div>
              <div>
                <Text type="secondary">STT (Reconocimiento de Voz / Whisper):</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={sttMs} onChange={setSttMs} options={STT_OPTIONS} />
              </div>
              <div>
                <Text type="secondary">Transporte de Red (WiFi / WAN):</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={netMs} onChange={setNetMs} options={NETWORK_OPTIONS} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="2. Parámetros de Inferencia y Salida (Respuesta IA)" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">LLM Time-To-First-Token (TTFT):</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={llmMs} onChange={setLlmMs} options={LLM_OPTIONS} />
              </div>
              <div>
                <Text type="secondary">TTS (Síntesis de Voz / Audio Out):</Text>
                <Select style={{ width: '100%', marginTop: 6 }} value={ttsMs} onChange={setTtsMs} options={TTS_OPTIONS} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="3. Desglose de Latencia Total y Experiencia Humana" className={styles.cardSurface}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8}>
            <Space direction="vertical">
              <Text type="secondary">Latencia Extremo a Extremo:</Text>
              <Title level={2} style={{ margin: 0, color: rating.color === 'green' ? '#22c55e' : rating.color === 'blue' ? '#3b82f6' : rating.color === 'orange' ? '#f59e0b' : '#ef4444' }}>
                {totalMs} ms
              </Title>
              <Tag color={rating.color}>{rating.label}</Tag>
            </Space>
          </Col>

          <Col xs={24} sm={16}>
            <Paragraph style={{ margin: 0 }}>{rating.desc}</Paragraph>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>VAD ({vadMs}ms)</span>
                <span>STT ({sttMs}ms)</span>
                <span>Net ({netMs}ms)</span>
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
              {simulating ? 'Simulando retraso...' : 'Simular Retraso Real de Conversación'}
            </Button>
            {simulating && (
              <div style={{ marginTop: 12 }}>
                <Text strong>{simStage}</Text>
                <Progress percent={simProgress} status="active" />
              </div>
            )}
          </Space>
        </div>
      </Card>

      <Card title="4. Arquitectura de Optimización para Hardware Embebido" className={styles.cardSurface}>
        <Paragraph style={{ margin: 0 }}>
          En interfaces de voz como el <strong>HIOS Node AI</strong>, la clave para bajar de los 500ms reside en dos técnicas:
          <br /><br />
          1. <strong>Streaming Token-to-Audio</strong>: No esperar a que el LLM termine toda la respuesta. Tan pronto como el LLM genera las primeras 4 palabras, se envían al motor TTS (Piper C++), comenzando a reproducir el audio por el amplificador I2S mientras el modelo sigue generando el resto.
          <br /><br />
          2. <strong>VAD Inteligente con TinyML</strong>: En lugar de un silencio estático de 500ms, un clasificador TinyML en el ESP32-S3 detecta la entonación descendente de cierre de frase, cortando la grabación en solo 150ms.
        </Paragraph>
      </Card>
    </Space>
  );
}
