/**
 * IPv6 address expansion and compression per RFC 5952, fully client-side.
 * Pure helpers, no dependencies. `expandIpv6` yields the full 8-group form;
 * `compressIpv6` yields the canonical short form. Both return null on invalid
 * input. IPv4-mapped suffixes (e.g. '::ffff:192.168.1.1') are supported.
 */

const GROUP_COUNT = 8;

function parseHextet(group: string): number | null {
  // 1-4 hex digits only; reject empty, overlong, or non-hex.
  if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
    return null;
  }
  return parseInt(group, 16);
}

function parseIpv4(quad: string): [number, number] | null {
  const parts = quad.split('.');
  if (parts.length !== 4) {
    return null;
  }
  const octets: number[] = [];
  for (const part of parts) {
    // Decimal only, no leading '+'/'-', no leading zeros padding ambiguity.
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const value = parseInt(part, 10);
    if (value > 255) {
      return null;
    }
    octets.push(value);
  }
  // Two 16-bit groups: high octets and low octets.
  const high = (octets[0] << 8) | octets[1];
  const low = (octets[2] << 8) | octets[3];
  return [high, low];
}

/**
 * Parse an IPv6 string into exactly 8 numeric groups (0..0xffff each),
 * or null if the address is malformed.
 */
function parseGroups(addr: string): number[] | null {
  if (typeof addr !== 'string' || addr.length === 0) {
    return null;
  }

  // At most one '::' is permitted.
  const doubleColonCount = addr.split('::').length - 1;
  if (doubleColonCount > 1) {
    return null;
  }

  const hasDoubleColon = doubleColonCount === 1;

  // Convert a trailing IPv4 dotted quad into two hex groups before splitting.
  let work = addr;
  let tailGroups: number[] = [];
  const lastColon = work.lastIndexOf(':');
  const tail = lastColon === -1 ? work : work.slice(lastColon + 1);
  if (tail.includes('.')) {
    const ipv4 = parseIpv4(tail);
    if (ipv4 === null) {
      return null;
    }
    tailGroups = ipv4;
    // Keep the colon so the preceding segment still terminates correctly.
    work = lastColon === -1 ? '' : work.slice(0, lastColon + 1);
  }

  if (hasDoubleColon) {
    const [headPart, tailPart] = splitOnDoubleColon(work);
    if (headPart === null || tailPart === null) {
      return null;
    }

    const head = headPart === '' ? [] : headPart.split(':');
    const tailRest = tailPart === '' ? [] : tailPart.split(':');

    const headValues = toValues(head);
    const tailValues = toValues(tailRest);
    if (headValues === null || tailValues === null) {
      return null;
    }

    const present = headValues.length + tailValues.length + tailGroups.length;
    if (present > GROUP_COUNT) {
      return null;
    }
    // '::' must stand in for at least one group; with a full count it would be
    // redundant, but RFC parsing still accepts e.g. a::b filling the middle.
    const zeros = new Array<number>(GROUP_COUNT - present).fill(0);
    return [...headValues, ...zeros, ...tailValues, ...tailGroups];
  }

  // No '::': the literal must contain exactly GROUP_COUNT groups total.
  const literal = work.endsWith(':') ? work.slice(0, -1) : work;
  if (literal.startsWith(':') || literal.endsWith(':')) {
    return null;
  }
  const groups = literal === '' ? [] : literal.split(':');
  const values = toValues(groups);
  if (values === null) {
    return null;
  }
  const all = [...values, ...tailGroups];
  if (all.length !== GROUP_COUNT) {
    return null;
  }
  return all;
}

function splitOnDoubleColon(addr: string): [string | null, string | null] {
  const index = addr.indexOf('::');
  if (index === -1) {
    return [null, null];
  }
  const head = addr.slice(0, index);
  let tail = addr.slice(index + 2);
  // A '::' at the very start or end leaves an empty side, which is valid.
  // Guard against stray leading/trailing single colons on each side.
  if (head.endsWith(':') || tail.startsWith(':')) {
    return [null, null];
  }
  if (tail.endsWith(':')) {
    tail = tail.slice(0, -1);
    if (tail.endsWith(':')) {
      return [null, null];
    }
  }
  return [head, tail];
}

function toValues(groups: string[]): number[] | null {
  const values: number[] = [];
  for (const group of groups) {
    const value = parseHextet(group);
    if (value === null) {
      return null;
    }
    values.push(value);
  }
  return values;
}

export function expandIpv6(addr: string): string | null {
  const groups = parseGroups(addr);
  if (groups === null) {
    return null;
  }
  return groups.map((g) => g.toString(16).padStart(4, '0')).join(':');
}

export function compressIpv6(addr: string): string | null {
  const groups = parseGroups(addr);
  if (groups === null) {
    return null;
  }

  // Find the longest run of consecutive all-zero groups (leftmost on a tie).
  let bestStart = -1;
  let bestLen = 0;
  let runStart = -1;
  let runLen = 0;
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i] === 0) {
      if (runStart === -1) {
        runStart = i;
        runLen = 1;
      } else {
        runLen += 1;
      }
      if (runLen > bestLen) {
        bestLen = runLen;
        bestStart = runStart;
      }
    } else {
      runStart = -1;
      runLen = 0;
    }
  }

  const hextets = groups.map((g) => g.toString(16));

  // Only collapse a run of length >= 2 into '::'.
  if (bestLen >= 2) {
    const before = hextets.slice(0, bestStart);
    const after = hextets.slice(bestStart + bestLen);
    return `${before.join(':')}::${after.join(':')}`;
  }

  return hextets.join(':');
}
