import { readFileSync } from 'node:fs';

type Json = Record<string, unknown>;

const LOCALES = ['en', 'es', 'de', 'it'] as const;
const REFERENCE = 'en';

function load(locale: string): Json {
  const url = new URL(`../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as Json;
}

function flatten(obj: Json, prefix = '', acc: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v as Json, key, acc);
    } else {
      acc[key] = String(v);
    }
  }
  return acc;
}

const ref = flatten(load(REFERENCE));
const refKeys = Object.keys(ref);
const refSet = new Set(refKeys);

let failures = 0;

for (const locale of LOCALES) {
  if (locale === REFERENCE) continue;
  const cur = flatten(load(locale));
  const curKeys = new Set(Object.keys(cur));
  const missing = refKeys.filter((k) => !curKeys.has(k));
  const dead = [...curKeys].filter((k) => !refSet.has(k));

  if (missing.length || dead.length) {
    failures++;
    console.error(`✗ ${locale}: ${missing.length} faltantes, ${dead.length} muertas`);
    missing.slice(0, 25).forEach((k) => console.error(`    falta:  ${k}`));
    if (missing.length > 25) console.error(`    ... (+${missing.length - 25} faltantes)`);
    dead.slice(0, 25).forEach((k) => console.error(`    muerta: ${k}`));
    if (dead.length > 25) console.error(`    ... (+${dead.length - 25} muertas)`);
  } else {
    console.log(`✓ ${locale}: ${curKeys.size} claves, sin drift vs ${REFERENCE}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} locale(s) con drift de i18n`);
  process.exit(1);
}
console.log(`\nAll i18n self-tests passed (${refKeys.length} claves x ${LOCALES.length} locales)`);
