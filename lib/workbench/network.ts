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

export interface RdapEvent {
  action: string;
  date: string;
}

export interface RdapLookupResponse {
  domain: string;
  handle?: string;
  status: string[];
  nameservers: string[];
  registrar?: string;
  events: RdapEvent[];
  links: string[];
  durationMs: number;
  fetchedAt: string;
}

export interface SubnetInfo {
  cidr: string;
  address: string;
  prefix: number;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
}

export function ipv4ToNumber(ip: string) {
  const parts = ip.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts.reduce((acc, part) => ((acc << 8) | part) >>> 0, 0);
}

export function numberToIpv4(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
}

export function calculateSubnet(address: string, prefix: number): SubnetInfo | null {
  const ipNumber = ipv4ToNumber(address);
  if (ipNumber === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const network = (ipNumber & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);
  const usableHosts = prefix >= 31 ? totalAddresses : Math.max(0, totalAddresses - 2);

  return {
    cidr: `${numberToIpv4(network)}/${prefix}`,
    address: numberToIpv4(ipNumber),
    prefix,
    subnetMask: numberToIpv4(mask),
    wildcardMask: numberToIpv4(wildcard),
    networkAddress: numberToIpv4(network),
    broadcastAddress: numberToIpv4(broadcast),
    firstHost: numberToIpv4(prefix >= 31 ? network : network + 1),
    lastHost: numberToIpv4(prefix >= 31 ? broadcast : broadcast - 1),
    totalAddresses,
    usableHosts,
  };
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
    const maybeCode = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';

    switch (maybeCode) {
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
