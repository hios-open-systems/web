import {
  formatNetworkError,
  isValidHostname,
  normalizeHostname,
  type RdapLookupResponse,
} from '@/lib/workbench/network';

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, Array<[string, unknown, string, string]>];
}

interface RdapLink {
  href?: string;
}

interface RdapNameserver {
  ldhName?: string;
}

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapDomain {
  handle?: string;
  status?: string[];
  nameservers?: RdapNameserver[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  links?: RdapLink[];
}

function getRegistrar(entities: RdapEntity[] = []) {
  const registrar = entities.find((entity) => entity.roles?.includes('registrar'));
  const entries = registrar?.vcardArray?.[1] ?? [];
  return entries.find((entry) => entry[0] === 'fn')?.[3];
}

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = normalizeHostname(searchParams.get('domain') ?? '');

  if (!isValidHostname(domain)) {
    return Response.json({ error: 'Invalid domain' }, { status: 400 });
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { accept: 'application/rdap+json, application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Domain not found in RDAP' : `RDAP returned ${response.status}`);
    }

    const data = (await response.json()) as RdapDomain;
    const payload: RdapLookupResponse = {
      domain,
      handle: data.handle,
      status: data.status ?? [],
      nameservers: (data.nameservers ?? []).map((nameserver) => nameserver.ldhName).filter((value): value is string => Boolean(value)),
      registrar: getRegistrar(data.entities),
      events: (data.events ?? [])
        .filter((event) => event.eventAction && event.eventDate)
        .map((event) => ({ action: event.eventAction!, date: event.eventDate! })),
      links: (data.links ?? []).map((link) => link.href).filter((value): value is string => Boolean(value)),
      durationMs: Date.now() - startedAt,
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(payload, { status: 200 });
  } catch (error) {
    return Response.json({ error: formatNetworkError(error) }, { status: 400 });
  }
}
