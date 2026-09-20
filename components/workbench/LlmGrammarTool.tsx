'use client';

import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Typography, Tag } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Paragraph } = Typography;

const COMMAND_TEMPLATES = [
  {
    id: 'home_automation',
    name: 'Domótica: Relés y Luces',
    actions: ['turn_on', 'turn_off', 'toggle', 'dim'],
    devices: ['relay_1', 'relay_2', 'desk_lamp', 'fan'],
    payloadField: 'brightness_pct',
  },
  {
    id: 'sensor_node',
    name: 'Telemetría: Sensores y Muestreo',
    actions: ['read_telemetry', 'calibrate', 'set_interval'],
    devices: ['bme280', 'battery_adc', 'imu_sensor'],
    payloadField: 'rate_seconds',
  },
  {
    id: 'audio_synth',
    name: 'Audio: Tono y Generador',
    actions: ['play_tone', 'stop_tone', 'set_volume'],
    devices: ['buzzer', 'i2s_dac'],
    payloadField: 'frequency_hz',
  },
];

export function LlmGrammarTool() {
  const [templateId, setTemplateId] = useState<string>('home_automation');
  const [format, setFormat] = useState<'gbnf' | 'json_schema'>('gbnf');
  const systemContext = 'Eres el controlador de hardware del sistema HIOS.';

  const selectedTemplate = useMemo(() => {
    return COMMAND_TEMPLATES.find((t) => t.id === templateId) || COMMAND_TEMPLATES[0];
  }, [templateId]);

  const gbnfGrammar = useMemo(() => {
    const actionsRule = selectedTemplate.actions.map((a) => `"\\"${a}\\""`).join(' | ');
    const devicesRule = selectedTemplate.devices.map((d) => `"\\"${d}\\""`).join(' | ');

    return `# =======================================================
# Gramática GBNF para llama.cpp / llama-server
# Fuerza al modelo a emitir ÚNICAMENTE este comando de hardware
# =======================================================
root ::= "{" ws "\\"action\\"" ws ":" ws action "," ws "\\"device\\"" ws ":" ws device "," ws "\\"${selectedTemplate.payloadField}\\"" ws ":" ws number ws "}"

action ::= ${actionsRule}
device ::= ${devicesRule}
number ::= [0-9]+
ws ::= [ \\t\\n\\r]*
`;
  }, [selectedTemplate]);

  const jsonSchemaStr = useMemo(() => {
    const schema = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: selectedTemplate.actions,
        },
        device: {
          type: 'string',
          enum: selectedTemplate.devices,
        },
        [selectedTemplate.payloadField]: {
          type: 'integer',
          minimum: 0,
          maximum: 1000,
        },
      },
      required: ['action', 'device', selectedTemplate.payloadField],
      additionalProperties: false,
    };
    return JSON.stringify(schema, null, 2);
  }, [selectedTemplate]);

  const llamaCppCommand = useMemo(() => {
    if (format === 'gbnf') {
      return `# Ejecutar con llama-cli aplicando la gramática estricta:
llama-cli -m model.gguf --grammar-file grammar.gbnf -p "${systemContext} Comando del usuario: enciende la lampara del escritorio al 80%"`;
    }
    return `# Llamada HTTP a Ollama con JSON Schema estricto:
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "messages": [{"role": "user", "content": "Enciende la lampara del escritorio al 80%"}],
  "format": ${jsonSchemaStr.replace(/\n/g, '\n  ')},
  "stream": false
}'`;
  }, [format, systemContext, jsonSchemaStr]);

  const esp32DispatchCode = useMemo(() => {
    return `// Despacho de comando en ESP32 con ArduinoJson v7
void handleHardwareCommand(const char* jsonPayload) {
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, jsonPayload);
  if (err) return;

  const char* action = doc["action"];
  const char* device = doc["device"];
  int val = doc["${selectedTemplate.payloadField}"];

  if (strcmp(action, "turn_on") == 0) {
    if (strcmp(device, "desk_lamp") == 0) {
      analogWrite(PIN_DESK_LAMP, map(val, 0, 100, 0, 255));
    }
  } else if (strcmp(action, "turn_off") == 0) {
    if (strcmp(device, "desk_lamp") == 0) {
      digitalWrite(PIN_DESK_LAMP, LOW);
    }
  }
}`;
  }, [selectedTemplate]);

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
        eyebrow="Open Software & Control"
        title="Generador de Gramáticas GBNF & JSON Schema para Hardware"
        description="Fuerza a modelos de lenguaje locales (llama.cpp u Ollama) a responder con gramáticas estrictas para accionar relés, sensores y periféricos en microcontroladores sin alucinaciones."
        locality="local"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="1. Selección de Perfil de Hardware" className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">Plantilla de Dispositivo:</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={templateId}
                  onChange={setTemplateId}
                  options={COMMAND_TEMPLATES.map((t) => ({ label: t.name, value: t.id }))}
                />
              </div>

              <div>
                <Text type="secondary">Formato de Restricción Estructural:</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={format}
                  onChange={setFormat}
                  options={[
                    { label: 'Gramática GBNF Nativa (llama.cpp / llama-server)', value: 'gbnf' },
                    { label: 'JSON Schema Estricto (Ollama / OpenAI Format)', value: 'json_schema' },
                  ]}
                />
              </div>

              <div>
                <Text type="secondary">Acciones Permitidas en Silicio:</Text>
                <div style={{ marginTop: 6 }}>
                  {selectedTemplate.actions.map((act) => (
                    <Tag color="blue" key={act} style={{ marginBottom: 4 }}>
                      {act}
                    </Tag>
                  ))}
                </div>
              </div>

              <div>
                <Text type="secondary">Dispositivos / Nombres:</Text>
                <div style={{ marginTop: 6 }}>
                  {selectedTemplate.devices.map((dev) => (
                    <Tag color="purple" key={dev} style={{ marginBottom: 4 }}>
                      {dev}
                    </Tag>
                  ))}
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="2. Definición Estructural" className={styles.cardSurface}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>{format === 'gbnf' ? 'Archivo `grammar.gbnf`:' : 'Definición `schema.json`:'}</Text>
              <CopyButton value={format === 'gbnf' ? gbnfGrammar : jsonSchemaStr} />
            </div>
            <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 12, maxHeight: 260, margin: 0 }}>
              {format === 'gbnf' ? gbnfGrammar : jsonSchemaStr}
            </pre>
          </Card>
        </Col>
      </Row>

      <Card title="3. Invocación de Inferencia Restringida" className={styles.cardSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>Comando para la PC local:</Text>
          <CopyButton value={llamaCppCommand} />
        </div>
        <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
          {llamaCppCommand}
        </pre>
      </Card>

      <Card title="4. Recepción y Despacho en Firmware C++ (ESP32)" className={styles.cardSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>Handler en `src/main.cpp`:</Text>
          <CopyButton value={esp32DispatchCode} />
        </div>
        <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
          {esp32DispatchCode}
        </pre>
      </Card>

      <Card title="5. Por qué las Gramáticas son Vitales en Silicio" className={styles.cardSurface}>
        <Paragraph style={{ margin: 0 }}>
          Sin una gramática estructurada, un LLM puede responder frases conversacionales como <em>&ldquo;¡Por supuesto! Procedo a encender el relé...&rdquo;</em>, lo cual rompe el deserializador JSON del microcontrolador.
          Las <strong>Gramáticas GBNF</strong> intervienen en el nivel de logits durante el muestreo (sampling) de la red neuronal, forzando la probabilidad de cualquier token no permitido a cero absoluto. El resultado en el microcontrolador es un payload 100% determinístico y seguro.
        </Paragraph>
      </Card>
    </Space>
  );
}
