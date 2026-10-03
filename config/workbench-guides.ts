import type { WorkbenchToolId } from './workbench';

/** Guide keys are shared with the existing Workbench.guides translations. */
export const workbenchGuideIds: Partial<Record<WorkbenchToolId, string>> = {
  'guitar-tuner': 'guitarTuner', 'note-frequency': 'noteFrequency',
  'resistor-color-code': 'resistorColorCode', 'ohms-law': 'ohmsLaw',
  'http-status-codes': 'httpStatusCodes', 'ascii-unicode': 'asciiUnicode',
  'ipv6-expand': 'ipv6Expand', hmac: 'hmac', 'csv-json': 'csvJson',
  patterns: 'patterns', notes: 'notes', mermaid: 'mermaid',
  'text-diff': 'textDiff', regex: 'regex', 'uuid-ulid': 'uuidUlid',
  encoder: 'encoder', 'hash-digest': 'hashDigest',
  payload: 'payload', snippets: 'snippets', 'type-checker': 'typeChecker',
  'jwt-decode': 'jwtPlayground', 'dns-lookup': 'dnsLookup',
  'certificate-check': 'certificateCheck', 'object-to-types': 'objectToTypes',
  'random-string': 'randomString', 'object-compare': 'objectCompare',
  'site-checker': 'siteChecker',
};
