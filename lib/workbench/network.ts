export const dnsRecordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'] as const;

export type DnsRecordType = (typeof dnsRecordTypes)[number];

export interface DnsAnswer {
  value: string;
  priority?: number;
}

export interface DnsLookupResponse {
  domain: string;
  type: DnsRecordType;
  answers: DnsAnswer[];
  durationMs: number;
  fetchedAt: string;
}

export interface CertificateLookupResponse {
  hostname: string;
  port: number;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  fingerprint: string;
  serialNumber: string;
  subjectAltName?: string;
  durationMs: number;
  fetchedAt: string;
}

export function normalizeHostname(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '')
    .toLowerCase();
}

export function isValidHostname(hostname: string) {
  if (!hostname || hostname.length > 253) {
    return false;
  }

  const labels = hostname.split('.');
  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

export function formatNetworkError(error: unknown) {
  if (error instanceof Error) {
    const code = 'code' in error ? String((error as NodeJS.ErrnoException).code ?? '') : '';
    switch (code) {
      case 'ENOTFOUND':
        return 'Host not found';
      case 'ENODATA':
        return 'No records found for that query';
      case 'ECONNRESET':
        return 'Remote host closed the connection';
      case 'ETIMEDOUT':
        return 'Connection timed out';
      default:
        return error.message || 'Network lookup failed';
    }
  }

  return 'Network lookup failed';
}

export function parsePort(input: string | null) {
  const parsed = Number(input ?? '443');
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }

  return parsed;
}