import { readRaw, writeRaw, removeRaw } from '../lib/storage/safeLocalStorage.ts';

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

type W = { window?: unknown };
const g = globalThis as W;

ok('SSR read -> null', readRaw('k') === null);
writeRaw('k', 'v');
ok('SSR write is a no-op', readRaw('k') === null);

const store = new Map<string, string>();
g.window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  },
};

writeRaw('a', 'hello');
ok('round-trip', readRaw('a') === 'hello');
ok('missing -> null', readRaw('missing') === null);
removeRaw('a');
ok('remove clears', readRaw('a') === null);

g.window = {
  localStorage: {
    getItem: () => {
      throw new Error('boom');
    },
    setItem: () => {
      throw new Error('boom');
    },
    removeItem: () => {
      throw new Error('boom');
    },
  },
};

ok('throwing getItem -> null', readRaw('a') === null);
let threw = false;
try {
  writeRaw('a', 'x');
  removeRaw('a');
} catch {
  threw = true;
}
ok('throwing set/remove swallowed', !threw);

delete g.window;

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll safeLocalStorage self-tests passed');
