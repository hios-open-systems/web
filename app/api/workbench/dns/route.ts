import {
  dnsRecordTypes,
  formatNetworkError,
  isValidHostname,
  normalizeHostname,
  type DnsAnswer,
  type DnsRecordType,
  type DnsLookupResponse,
} from '@/lib/workbench/network';

interface GoogleDnsAnswer {
  data?: string;
  name?: string;
  TTL?: number;
  type?: number;
}

interface GoogleDnsQuestion {
  name?: string;
  type?: number;
}

interface GoogleDnsResponse {
  Status?: number;
  Answer?: GoogleDnsAnswer[];
  Question?: GoogleDnsQuestion[];
  Comment?: string;
}

function parseDnsAnswer(type: DnsRecordType, answer: GoogleDnsAnswer): DnsAnswer | null {
  const value = answer.data?.trim();

  if (!value) {
    return null;
  }

  if (type === 'MX') {
    const [priorityToken, ...exchangeParts] = value.split(/\s+/);
    const priority = Number(priorityToken);
    return {
      value: exchangeParts.join(' ') || value,
      priority: Number.isFinite(priority) ? priority : undefined,
    };
  }

  if (type === 'TXT') {
    return {
      value: value.replace(/^"|"$/g, ''),
    };
  }

  return { value };
}


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
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: {
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`DNS provider returned ${response.status}`);
    }

    const data = (await response.json()) as GoogleDnsResponse;
    if (typeof data.Status === 'number' && data.Status !== 0 && data.Status !== 3) {
      throw new Error(data.Comment || 'DNS lookup failed');
    }

    const answers = (data.Answer ?? [])
      .map((answer) => parseDnsAnswer(type, answer))
      .filter((answer): answer is DnsAnswer => Boolean(answer));

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