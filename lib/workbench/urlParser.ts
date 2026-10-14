export interface ParsedURL {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: { key: string; value: string }[];
  origin: string;
  href: string;
}

export function parseURL(raw: string): ParsedURL | null {
  try {
    const url = new URL(raw.trim());
    const params: { key: string; value: string }[] = [];
    url.searchParams.forEach((v, k) => params.push({ key: k, value: v }));
    return {
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      hash: url.hash,
      params,
      origin: url.origin,
      href: url.href,
    };
  } catch {
    return null;
  }
}

export function buildURL(parsed: ParsedURL): string {
  try {
    const url = new URL(parsed.href);
    const params = new URLSearchParams();
    parsed.params.forEach(({ key, value }) => params.append(key, value));
    url.search = params.toString();
    return url.href;
  } catch {
    return '';
  }
}
