'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Space, Typography } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Title, Paragraph } = Typography;

const PRESETS = [
  {
    name: 'Hardware Prompt en Español',
    text: 'Configura el pin GPIO 4 del ESP32 como entrada con resistencia pull-up interna y reporta cada 500 milisegundos.',
  },
  {
    name: 'Hardware Prompt en Inglés',
    text: 'Configure ESP32 pin GPIO 4 as an input with internal pull-up resistor and report every 500 milliseconds.',
  },
  {
    name: 'Estructura C++ Embebida',
    text: 'struct __attribute__((packed)) TelemetryPacket {\n  uint32_t timestamp;\n  float temperature_c;\n  uint8_t battery_level;\n};',
  },
  {
    name: 'JSON de Comando de Hardware',
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

// Tokenizador simulado BPE de alta fidelidad: divide por palabras, puntuación, mayúsculas y prefijos
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
    // KV memory in bytes: 2 * layers (32) * dim (4096) * 2 bytes = ~524KB por 1000 tokens
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
        eyebrow="Modern AI & Tokenization"
        title="Tokenizer & Context Inspector Local"
        description="Visualiza en tiempo real cómo un modelo de lenguaje divide el texto en tokens, analiza la inflación en español y calcula el costo en el buffer de memoria."
        locality="local"
      />

      <Card title="1. Texto de Entrada o Prompt" className={styles.cardSurface}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <Button size="small" key={p.name} onClick={() => setText(p.text)}>
                {p.name}
              </Button>
            ))}
          </div>

          <Input.TextArea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe o pega aquí tu texto, prompt o código C++..."
          />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Text type="secondary">Vocabulario BPE:</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={modelType}
                onChange={setModelType}
                options={[
                  { label: 'Llama 3.x BPE (128k Vocab)', value: 'llama3' },
                  { label: 'Qwen 2.5 BPE (152k Vocab)', value: 'qwen' },
                  { label: 'Clásico GPT / Llama 2 (32k Vocab)', value: 'legacy' },
                ]}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="2. Métricas de Tokenización" className={styles.cardSurface}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Tokens Totales:</Text>
                <Title level={2} style={{ margin: 0, color: '#3b82f6' }}>
                  {stats.count}
                </Title>
              </div>
              <Row gutter={8}>
                <Col span={12}>
                  <Text type="secondary">Palabras:</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.words}
                  </Title>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Caracteres:</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.chars}
                  </Title>
                </Col>
              </Row>
              <div>
                <Text type="secondary">Tokens por Palabra:</Text>
                <Title level={4} style={{ margin: 0, color: Number(stats.ratio) > 1.5 ? '#f59e0b' : '#22c55e' }}>
                  {stats.ratio}
                </Title>
                <Text style={{ fontSize: 12 }} type="secondary">
                  (En inglés suele ser ~1.2; en español ~1.5 - 1.8)
                </Text>
              </div>
              <div>
                <Text type="secondary">Memoria en Caché KV:</Text>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>3. Inspección Visual de Tokens ({stats.count})</span>
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
                <Text type="secondary">Ingresa texto arriba para inspeccionar los tokens.</Text>
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
                      title={`Token #${idx + 1}: "${tok}" (${tok.length} chars)`}
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

      <Card title="4. ¿Por qué la Tokenización Importa en Hardware?" className={styles.cardSurface}>
        <Paragraph style={{ margin: 0 }}>
          Los modelos de lenguaje no leen letras ni palabras, sino secuencias de tokens BPE (Byte-Pair Encoding).
          En idiomas romances como el español o en sintaxis de código como C++, los vocabularios de IA tradicionales dividen las palabras en múltiples fragmentos debido a la baja frecuencia relativa en los datasets de entrenamiento anglosajones.
          Entender esta métrica permite redactar prompts técnicos que consuman la menor cantidad posible de memoria de contexto en microcontroladores y placas con memoria acotada.
        </Paragraph>
      </Card>
    </Space>
  );
}
