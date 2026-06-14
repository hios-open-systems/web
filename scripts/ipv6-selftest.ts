/**
 * Self-test for the IPv6 expand/compress tool logic. Pure helpers against
 * RFC 5952 vectors plus IPv4-mapped and invalid-input cases.
 *
 * Run: node --experimental-strip-types scripts/ipv6-selftest.ts
 */
import { compressIpv6, expandIpv6 } from '../lib/workbench/ipv6.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// expand
eq('expand ::1', expandIpv6('::1'), '0000:0000:0000:0000:0000:0000:0000:0001');
eq('expand ::', expandIpv6('::'), '0000:0000:0000:0000:0000:0000:0000:0000');

// compress
eq(
  'compress 2001:0db8:...:0001',
  compressIpv6('2001:0db8:0000:0000:0000:0000:0000:0001'),
  '2001:db8::1',
);
eq('compress all zeros', compressIpv6('0000:0000:0000:0000:0000:0000:0000:0000'), '::');
eq('compress ::1', compressIpv6('0000:0000:0000:0000:0000:0000:0000:0001'), '::1');

// round-trip
eq('round-trip 2001:db8::1', compressIpv6(expandIpv6('2001:db8::1') ?? ''), '2001:db8::1');

// tie / longest run (leftmost-longest collapses)
eq('tie longest run', compressIpv6('2001:0:0:1:0:0:0:1'), '2001:0:0:1::1');

// IPv4-mapped
eq(
  'IPv4-mapped expand',
  expandIpv6('::ffff:192.168.1.1'),
  '0000:0000:0000:0000:0000:ffff:c0a8:0101',
);

// invalid
eq('invalid xyz', expandIpv6('xyz'), null);
eq('invalid 1:2:3', expandIpv6('1:2:3'), null);
eq('invalid 12345::', expandIpv6('12345::'), null);
eq('invalid 1::2::3', expandIpv6('1::2::3'), null);

// extra sanity: octet > 255 and group > ffff
eq('invalid octet > 255', expandIpv6('::ffff:256.1.1.1'), null);
eq('IPv4-mapped compress', compressIpv6('::ffff:192.168.1.1'), '::ffff:c0a8:101');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll IPv6 self-tests passed');
