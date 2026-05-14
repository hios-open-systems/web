import { resolve4, resolve6, resolveCname, resolveMx, resolveNs, resolveTxt } from 'node:dns/promises';
import {
  dnsRecordTypes,
  formatNetworkError,
  isValidHostname,
  normalizeHostname,
  type DnsAnswer,
  type DnsRecordType,
  type DnsLookupResponse,
} from '@/lib/workbench/network';

const dnsResolvers: Record<DnsRecordType, (domain: string) => Promise<DnsAnswer[]>> = {
  A: async (domain) => (await resolve4(domain)).map((value) => ({ value })),
  AAAA: async (domain) => (await resolve6(domain)).map((value) => ({ value })),
  CNAME: async (domain) => (await resolveCname(domain)).map((value) => ({ value })),
  MX: async (domain) => (await resolveMx(domain)).map((entry) => ({ value: entry.exchange, priority: entry.priority })),
  TXT: async (domain) => (await resolveTxt(domain)).map((entry) => ({ value: entry.join(' ') })),
  NS: async (domain) => (await resolveNs(domain)).map((value) => ({ value })),
};

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = normalizeHostname(searchParams.get('domain') ?? '');
  const type = (searchParams.get('type') ?? 'A').toUpperCase() as DnsRecordType;

  if (!isValidHostname(domain)) {
    return Response.json({ error: 'Invalid domain' }, { status: 400 });
  }

  if (!dnsRecordTypes.includes(type)) {
    return Response.json({ error: 'Unsupported record type' }, { status: 400 });
  }

  const startedAt = Date.now();

  try {
    const answers = await dnsResolvers[type](domain);
    const payload: DnsLookupResponse = {
      domain,
      type,
      answers,
      durationMs: Date.now() - startedAt,
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(payload, { status: 200 });
  } catch (error) {
    return Response.json({ error: formatNetworkError(error) }, { status: 400 });
  }
}