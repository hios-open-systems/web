'use client';
import { useEffect, useState } from 'react';
import type { RegexResult, replacePreview } from '@/lib/workbench/regex';
interface Result { result: RegexResult; replaced: ReturnType<typeof replacePreview> | null }
export function useRegexWorker(pattern: string, flags: string, input: string, replacement: string) {
  const [state, setState] = useState<Result>({ result: { ok: true, matches: [], truncated: false }, replaced: null });
  useEffect(() => {
    const worker = new Worker(new URL('../workbench/regex.worker.ts', import.meta.url));
    const timer = setTimeout(() => {
      worker.terminate();
      setState({ result: { ok: false, error: 'Execution limit: 2 seconds' }, replaced: null });
    }, 2000);
    worker.onmessage = (event: MessageEvent<Result>) => { clearTimeout(timer); setState(event.data); worker.terminate(); };
    worker.onerror = () => { clearTimeout(timer); setState({ result: { ok: false, error: 'Worker unavailable' }, replaced: null }); worker.terminate(); };
    worker.postMessage({ pattern, flags, input, replacement });
    return () => { clearTimeout(timer); worker.terminate(); };
  }, [pattern, flags, input, replacement]);
  return state;
}
