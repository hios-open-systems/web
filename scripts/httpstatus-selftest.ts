/**
 * Self-test for the HTTP Status reference tool logic. Verifies the registry
 * shape plus the pure categorize and search helpers.
 *
 * Run: node --experimental-strip-types scripts/httpstatus-selftest.ts
 */
import { HTTP_STATUS, getCategory, searchStatus } from '../lib/workbench/httpStatus.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Search by code
eq("searchStatus('404')[0].name", searchStatus('404')[0]?.name, 'Not Found');

// Categorize
eq('getCategory(503)', getCategory(503), '5xx');
eq('getCategory(200)', getCategory(200), '2xx');
eq('getCategory(700)', getCategory(700), 'unknown');

// Teapot easter egg
const teapot = HTTP_STATUS.find((s) => s.code === 418);
eq('418 name contains teapot', teapot?.name.toLowerCase().includes('teapot'), true);
eq("searchStatus('teapot') finds 418", searchStatus('teapot').some((s) => s.code === 418), true);

// Registry is reasonably comprehensive
eq('HTTP_STATUS.length > 40', HTTP_STATUS.length > 40, true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll HTTP status self-tests passed');
