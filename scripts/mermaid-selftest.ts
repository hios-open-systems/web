/**
 * Self-test for the Mermaid tool pure helpers (templates + heuristics).
 * The actual render is DOM-bound and covered by the smoke test.
 *
 * Run: node --experimental-strip-types scripts/mermaid-selftest.ts
 */
import {
  MERMAID_TEMPLATES,
  MERMAID_TEMPLATE_IDS,
  looksLikeMermaid,
  svgFilename,
} from '../lib/workbench/mermaid.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

ok('6 templates', MERMAID_TEMPLATE_IDS.length === 6);
ok('all templates non-empty', MERMAID_TEMPLATE_IDS.every((id) => MERMAID_TEMPLATES[id].trim().length > 10));
ok('flowchart template starts right', MERMAID_TEMPLATES.flowchart.startsWith('flowchart'));

ok('looksLikeMermaid flowchart', looksLikeMermaid('flowchart TD\n A-->B'));
ok('looksLikeMermaid sequence', looksLikeMermaid('sequenceDiagram\n A->>B: hi'));
ok('looksLikeMermaid graph', looksLikeMermaid('graph LR; a-->b'));
ok('rejects prose', !looksLikeMermaid('just some text here'));
ok('rejects empty', !looksLikeMermaid('   '));

ok('svgFilename default', svgFilename('') === 'diagram.svg');
ok('svgFilename slug', svgFilename('Flowchart TD: Start!') === 'flowchart-td-start.svg');
ok('svgFilename trims junk', svgFilename('***') === 'diagram.svg');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll mermaid self-tests passed');
