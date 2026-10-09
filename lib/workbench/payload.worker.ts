import { analyzePayload, PAYLOAD_LIMIT, valueAt, type PayloadPath } from './payloadEngine';
let root: unknown;
self.onmessage = (event: MessageEvent<{ id: number; type: string; input?: string; path?: PayloadPath; minified?: boolean }>) => {
  const { id, type } = event.data;
  try {
    if (type === 'parse') {
      const input = event.data.input ?? '';
      const bytes = new TextEncoder().encode(input).length;
      if (bytes > PAYLOAD_LIMIT) throw new Error('tooLarge');
      root = JSON.parse(input);
      self.postMessage({ id, type, analysis: analyzePayload(root, bytes) });
    } else {
      const value = valueAt(root, event.data.path ?? []);
      const text = JSON.stringify(value, null, event.data.minified ? 0 : 2);
      if (type === 'stats') {
        const { nodes, ...summary } = analyzePayload(value, new TextEncoder().encode(text).length);
        self.postMessage({ id, type, text: JSON.stringify({ ...summary, nodes: nodes.length }, null, 2) });
        return;
      }
      self.postMessage({ id, type, text: type === 'preview' ? text.slice(0, 100_000) : text, truncated: text.length > 100_000 });
    }
  } catch (error) { self.postMessage({ id, type: 'error', error: error instanceof Error ? error.message : 'invalid' }); }
};
