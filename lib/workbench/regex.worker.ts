import { runRegex, replacePreview } from './regex';
self.onmessage = (event: MessageEvent<{ pattern: string; flags: string; input: string; replacement: string }>) => {
  const { pattern, flags, input, replacement } = event.data;
  self.postMessage({ result: runRegex(pattern, flags, input), replaced: replacement ? replacePreview(pattern, flags, input, replacement) : null });
};
