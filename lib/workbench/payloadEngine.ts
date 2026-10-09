export type PayloadPath = (string | number)[];
export interface PayloadNode { id: number; parent: number; key: string; path: PayloadPath; type: string; preview: string; children: number; depth: number }
export interface PayloadAnalysis { nodes: PayloadNode[]; bytes: number; depth: number; partial: boolean; counts: Record<string, number> }
export const PAYLOAD_LIMIT = 10 * 1024 * 1024;
const typeOf = (value: unknown) => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
export function analyzePayload(value: unknown, bytes: number): PayloadAnalysis {
  const result: PayloadAnalysis = { nodes: [], bytes, depth: 0, partial: false, counts: {} };
  const stack = [{ value, parent: -1, key: 'root', path: [] as PayloadPath, depth: 0 }];
  while (stack.length && result.nodes.length < 20_000) {
    const item = stack.pop()!;
    const type = typeOf(item.value);
    const composite = item.value !== null && typeof item.value === 'object';
    const keys = composite ? Object.keys(item.value as object) : [];
    const id = result.nodes.length;
    result.depth = Math.max(result.depth, item.depth);
    result.counts[type] = (result.counts[type] ?? 0) + 1;
    result.nodes.push({ id, parent: item.parent, key: item.key, path: item.path, depth: item.depth,
      type, children: keys.length, preview: composite ? `${keys.length}` : String(item.value).slice(0, 120) });
    if (item.depth >= 64 && keys.length) { result.partial = true; continue; }
    const budget = Math.max(0, 20_000 - result.nodes.length - stack.length);
    if (keys.length > budget) result.partial = true;
    for (let i = Math.min(keys.length, budget) - 1; i >= 0; i--) {
      const key = keys[i];
      stack.push({ value: (item.value as Record<string, unknown>)[key], parent: id, key, path: [...item.path, type === 'array' ? Number(key) : key], depth: item.depth + 1 });
    }
  }
  if (stack.length) result.partial = true;
  return result;
}

export function valueAt(root: unknown, path: PayloadPath): unknown {
  let current = root;
  for (const key of path) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) throw new Error('path');
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function payloadPaths(path: PayloadPath) {
  return {
    javascript: `payload${path.map(key => `[${JSON.stringify(key)}]`).join('')}`,
    jsonpath: `$${path.map(key => `[${JSON.stringify(key)}]`).join('')}`,
    pointer: path.length ? '/' + path.map(key => String(key).replace(/~/g, '~0').replace(/\//g, '~1')).join('/') : '',
  };
}

export function iterationExample(node: PayloadNode): string {
  const path = payloadPaths(node.path).javascript;
  if (node.type === 'array') return `${path}.map((item, index) => ({ index, value: item }));\n${path}.filter(item => item != null);\n${path}.reduce((count) => count + 1, 0);`;
  if (node.type === 'object') return `Object.entries(${path}).map(([key, value]) => ({ key, value }));\nObject.keys(${path});\nObject.values(${path});`;
  return `const value = ${path};`;
}
