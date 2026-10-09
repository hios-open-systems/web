import type { WorkbenchToolId } from '../../config/workbench.ts';
export const presetToolIds: WorkbenchToolId[] = [
  'payload', 'object-to-types', 'object-compare', 'json-schema', 'type-checker', 'encoder', 'hash-digest', 'regex', 'text-diff', 'mermaid',
  'subnet-calculator', 'ipv6-expand', 'ascii-unicode', 'cron', 'url-parser', 'token-inspector', 'esp32-llm-bridge',
  'voice-ai-latency', 'llm-vram-calc', 'llm-grammar-generator', 'metronome', 'delay-calculator', 'note-frequency', 'csv-json', 'hmac',
  'uuid-ulid',
  'color', 'timestamp', 'number-base', 'http-status-codes', 'image-convert', 'dns-lookup', 'whois-rdap', 'certificate-check',
  'site-checker', 'guitar-tuner', 'tone-generator',
  'random-string', 'ohms-law',
  'jwt-decode', 'resistor-color-code', 'serial-monitor',
];
export const toolAliases: Partial<Record<WorkbenchToolId, string>> = {
  payload: 'json formatter format inspect inspeccionar explorar formatear parse payload',
  'object-to-types': 'json typescript interfaces tipos types generieren tipi',
  'json-schema': 'json schema esquema validation validacion',
  'object-compare': 'compare comparar comparar dos json diff vergleichen confrontare',
  'type-checker': 'json typescript validation validar types tipos',
  'jwt-decode': 'jwt token authentication autenticar',
  'token-inspector': 'token tokenizer llm ia ai',
  'subnet-calculator': 'ip subnet subred red network',
  'ipv6-expand': 'ip ipv6 expand network red',
  'resistor-color-code': 'resistencia resistor colores resistance',
  'ohms-law': 'resistencia voltaje corriente resistance voltage current',
};
