import {
  formatNetworkError,
  isValidHostname,
  normalizeHostname,
  parsePort,
  type CertificateLookupResponse,
} from '@/lib/workbench/network';

interface SslLabsCert {
  subject?: string;
  issuerSubject?: string;
  commonNames?: string[];
  altNames?: string[];
  notBefore?: number;
  notAfter?: number;
  serialNumber?: string;
  sha256Hash?: string;
}

interface SslLabsEndpoint {
  ipAddress?: string;
  statusMessage?: string;
}

interface SslLabsResponse {
  status?: string;
  statusMessage?: string;
  certs?: SslLabsCert[];
  endpoints?: SslLabsEndpoint[];
}

function formatFingerprint(hash?: string) {
  if (!hash) {
    return 'Unknown';
  }

  return hash
    .toUpperCase()
    .match(/.{1,2}/g)
    ?.join(':') ?? hash.toUpperCase();
}

async function inspectCertificate(hostname: string, port: number) {
  const startedAt = Date.now();
  const url = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(hostname)}&publish=off&fromCache=on&all=done&ignoreMismatch=on&maxAge=24`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TLS provider returned ${response.status}`);
  }

  const data = (await response.json()) as SslLabsResponse;
  if (data.status && data.status !== 'READY') {
    throw new Error(data.statusMessage || `Certificate analysis ${data.status.toLowerCase()}`);
  }

  const leafCertificate = data.certs?.[0];
  if (!leafCertificate?.notAfter || !leafCertificate.notBefore) {
    throw new Error('No certificate metadata returned by provider');
  }

  const validFrom = new Date(leafCertificate.notBefore);
  const validTo = new Date(leafCertificate.notAfter);
  const daysRemaining = Math.ceil((validTo.getTime() - Date.now()) / 86400000);

  return {
    hostname,
    port,
    issuer: leafCertificate.issuerSubject ?? 'Unknown',
    subject: leafCertificate.subject ?? leafCertificate.commonNames?.[0] ?? hostname,
    validFrom: validFrom.toISOString(),
    validTo: validTo.toISOString(),
    daysRemaining,
    isExpired: daysRemaining < 0,
    fingerprint: formatFingerprint(leafCertificate.sha256Hash),
    serialNumber: leafCertificate.serialNumber ?? 'Unknown',
    subjectAltName: leafCertificate.altNames?.join(', ') || leafCertificate.commonNames?.join(', '),
    durationMs: Date.now() - startedAt,
    fetchedAt: new Date().toISOString(),
  } satisfies CertificateLookupResponse;
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostname = normalizeHostname(searchParams.get('hostname') ?? '');
  const port = parsePort(searchParams.get('port'));

  if (!isValidHostname(hostname)) {
    return Response.json({ error: 'Invalid hostname' }, { status: 400 });
  }

  if (!port) {
    return Response.json({ error: 'Invalid port' }, { status: 400 });
  }

  try {
    const payload = await inspectCertificate(hostname, port);
    return Response.json(payload, { status: 200 });
  } catch (error) {
    return Response.json({ error: formatNetworkError(error) }, { status: 400 });
  }
}