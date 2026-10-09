const safeSettings: Record<string, readonly string[]> = {
  payload: ['view'], 'object-to-types': ['rootName'], 'json-schema': ['rootName'], 'type-checker': ['rootName'],
  'random-string': ['options'], 'ohms-law': ['values'],
  'resistor-color-code': ['bandCount', 'colors'], 'serial-monitor': ['baudRate', 'appendNewline'],
  encoder: ['mode', 'dir'], 'hash-digest': ['algo'], 'uuid-ulid': ['type', 'count'],
  'subnet-calculator': ['prefix'], 'esp32-llm-bridge': ['port', 'btnGpio', 'ledGpio', 'sdaGpio', 'sclGpio'],
  'voice-ai-latency': ['vadMs', 'sttMs', 'llmMs', 'ttsMs', 'netMs'],
  'llm-vram-calc': ['vram', 'sysRam', 'modelIndex', 'contextTokens'],
  'llm-grammar-generator': ['templateId', 'format'], metronome: ['bpm', 'beats', 'subdivision'],
  'delay-calculator': ['bpm', 'milliseconds', 'temperature'], 'note-frequency': ['a4', 'octave', 'freq', 'midi'],
  'csv-json': ['direction', 'header'], hmac: ['algo'], 'number-base': ['activeBase'], 'image-convert': ['quality'],
  'dns-lookup': ['recordType'], 'certificate-check': ['port'], 'site-checker': ['intervalSeconds', 'timeoutMs', 'notifyOnFailure'],
  'guitar-tuner': ['instrument', 'tuningId', 'a4'],
  'tone-generator': ['mode', 'frequency', 'gain', 'waveform', 'noise', 'sweepStart', 'sweepEnd', 'sweepDuration', 'channel'],
};
export function validSettings(toolId: string, settings: Record<string, string>): boolean {
  return Object.keys(settings).every(key => (safeSettings[toolId] ?? []).includes(key));
}
