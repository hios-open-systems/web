/**
 * Interactive "modern patterns" lessons — catalog data only. Lesson prose is
 * i18n (Workbench.patterns.lessons.<id>.*); the code is language-neutral and
 * lives here. The code runs in a sandboxed iframe (see PatternsTool), never
 * with access to the site, the network, or the user's session.
 */

export interface Lesson {
  id: string;
  /** Starter code; must print deterministic output via console.log. */
  code: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'debounce',
    code: `// Debounce: collapse bursts into one trailing call.
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

let calls = 0;
const log = debounce(() => { calls++; console.log('ran, calls =', calls); }, 50);
log(); log(); log();           // burst -> 1 call
setTimeout(() => { log(); }, 120); // separate -> another call
setTimeout(() => console.log('total:', calls), 250);`,
  },
  {
    id: 'reducer',
    code: `// Reducer / state machine: pure transitions, no hidden state.
function reducer(state, action) {
  switch (action.type) {
    case 'inc': return { ...state, n: state.n + 1 };
    case 'dec': return { ...state, n: state.n - 1 };
    case 'reset': return { n: 0 };
    default: return state;
  }
}

let s = { n: 0 };
for (const a of [{type:'inc'},{type:'inc'},{type:'dec'},{type:'inc'}]) {
  s = reducer(s, a);
}
console.log('final state:', JSON.stringify(s));`,
  },
  {
    id: 'promisePool',
    code: `// Bounded concurrency: run N async tasks at a time.
const sleep = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));

async function pool(tasks, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const tasks = [1,2,3,4,5].map(n => () => sleep(20 * n, n * n));
pool(tasks, 2).then(r => console.log('results:', JSON.stringify(r)));`,
  },
];

export const LESSON_IDS = LESSONS.map((l) => l.id);

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
