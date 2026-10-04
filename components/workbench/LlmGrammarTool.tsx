'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Col, Row, Select, Space, Typography, Tag } from 'antd';
import { CopyButton } from './CopyButton';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text, Paragraph } = Typography;

const COMMAND_TEMPLATES = [
  {
    id: 'home_automation',
    name: 'homeTemplate',
    actions: ['turn_on', 'turn_off', 'toggle', 'dim'],
    devices: ['relay_1', 'relay_2', 'desk_lamp', 'fan'],
    payloadField: 'brightness_pct',
  },
  {
    id: 'sensor_node',
    name: 'sensorTemplate',
    actions: ['read_telemetry', 'calibrate', 'set_interval'],
    devices: ['bme280', 'battery_adc', 'imu_sensor'],
    payloadField: 'rate_seconds',
  },
  {
    id: 'audio_synth',
    name: 'audioTemplate',
    actions: ['play_tone', 'stop_tone', 'set_volume'],
    devices: ['buzzer', 'i2s_dac'],
    payloadField: 'frequency_hz',
  },
];

export function LlmGrammarTool() {
  const t = useTranslations('Workbench.grammar');
  const [templateId, setTemplateId] = useState<string>('home_automation');
  const [format, setFormat] = useState<'gbnf' | 'json_schema'>('gbnf');
  const systemContext = 'You are the hardware controller for HIOS.';

  const selectedTemplate = useMemo(() => {
    return COMMAND_TEMPLATES.find((t) => t.id === templateId) || COMMAND_TEMPLATES[0];
  }, [templateId]);

  const gbnfGrammar = useMemo(() => {
    const actionsRule = selectedTemplate.actions.map((a) => `"\\"${a}\\""`).join(' | ');
    const devicesRule = selectedTemplate.devices.map((d) => `"\\"${d}\\""`).join(' | ');

    return `# =======================================================
# GBNF grammar for llama.cpp / llama-server
# Constrains the output format; validate commands before execution
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
      return `# Run llama-cli with the grammar:
llama-cli -m model.gguf --grammar-file grammar.gbnf -p "${systemContext} User command: turn on the desk lamp at 80%"`;
    }
    return `# Ollama HTTP request with JSON Schema:
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "messages": [{"role": "user", "content": "Turn on the desk lamp at 80%"}],
  "format": ${jsonSchemaStr.replace(/\n/g, '\n  ')},
  "stream": false
}'`;
  }, [format, systemContext, jsonSchemaStr]);

  const esp32DispatchCode = useMemo(() => {
    return `// Illustrative ESP32 dispatch with ArduinoJson v7; add validation before use
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
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        locality="local"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t('profileTitle')} className={styles.cardSurface}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div>
                <Text type="secondary">{t('template')}</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={templateId}
                  onChange={setTemplateId}
                  options={COMMAND_TEMPLATES.map((template) => ({ label: t(template.name), value: template.id }))}
                />
              </div>

              <div>
                <Text type="secondary">{t('format')}</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  value={format}
                  onChange={setFormat}
                  options={[
                    { label: t('gbnfOption'), value: 'gbnf' },
                    { label: t('schemaOption'), value: 'json_schema' },
                  ]}
                />
              </div>

              <div>
                <Text type="secondary">{t('actions')}</Text>
                <div style={{ marginTop: 6 }}>
                  {selectedTemplate.actions.map((act) => (
                    <Tag color="blue" key={act} style={{ marginBottom: 4 }}>
                      {act}
                    </Tag>
                  ))}
                </div>
              </div>

              <div>
                <Text type="secondary">{t('devices')}</Text>
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
          <Card title={t('definitionTitle')} className={styles.cardSurface}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>{format === 'gbnf' ? t('gbnfFile') : t('schemaFile')}</Text>
              <CopyButton value={format === 'gbnf' ? gbnfGrammar : jsonSchemaStr} />
            </div>
            <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 12, maxHeight: 260, margin: 0 }}>
              {format === 'gbnf' ? gbnfGrammar : jsonSchemaStr}
            </pre>
          </Card>
        </Col>
      </Row>

      <Card title={t('invocationTitle')} className={styles.cardSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>{t('localCommand')}</Text>
          <CopyButton value={llamaCppCommand} />
        </div>
        <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
          {llamaCppCommand}
        </pre>
      </Card>

      <Card title={t('dispatchTitle')} className={styles.cardSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>{t('handler')}</Text>
          <CopyButton value={esp32DispatchCode} />
        </div>
        <pre style={{ background: 'var(--hios-bg-secondary)', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 13, margin: 0 }}>
          {esp32DispatchCode}
        </pre>
      </Card>

      <Card title={t('scopeTitle')} className={styles.cardSurface}>
        <Paragraph style={{ margin: 0 }}>
          {t('scope')}
        </Paragraph>
      </Card>
    </Space>
  );
}
