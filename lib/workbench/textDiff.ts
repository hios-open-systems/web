/**
 * Line-level diff via LCS. Pure, client-side. Capped to keep the O(n·m)
 * table bounded on huge inputs (degrades to a coarse diff past the cap).
 */

export type DiffOp = 'eq' | 'add' | 'del';

export interface DiffLine {
  type: DiffOp;
  value: string;
  /** 1-based line numbers, null on the side where the line is absent. */
  a: number | null;
  b: number | null;
}

export interface DiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  truncated: boolean;
}

const MAX_LINES = 4000;

function splitLines(text: string): string[] {
  if (text === '') return [];
  return text.replace(/\r\n/g, '\n').split('\n');
}

export function diffLines(a: string, b: string): DiffResult {
  const A = splitLines(a);
  const B = splitLines(b);
  const truncated = A.length > MAX_LINES || B.length > MAX_LINES;
  const aL = truncated ? A.slice(0, MAX_LINES) : A;
  const bL = truncated ? B.slice(0, MAX_LINES) : B;

  const n = aL.length;
  const m = bL.length;
  // LCS length table.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = aL[i] === bL[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aL[i] === bL[j]) {
      lines.push({ type: 'eq', value: aL[i], a: i + 1, b: j + 1 });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: 'del', value: aL[i], a: i + 1, b: null });
      removed += 1;
      i += 1;
    } else {
      lines.push({ type: 'add', value: bL[j], a: null, b: j + 1 });
      added += 1;
      j += 1;
    }
  }
  while (i < n) {
    lines.push({ type: 'del', value: aL[i], a: i + 1, b: null });
    removed += 1;
    i += 1;
  }
  while (j < m) {
    lines.push({ type: 'add', value: bL[j], a: null, b: j + 1 });
    added += 1;
    j += 1;
  }

  return { lines, added, removed, truncated };
}
