'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PAYLOAD_LIMIT, type PayloadAnalysis, type PayloadPath } from '@/lib/workbench/payloadEngine';

export function usePayloadWorker(input: string) {
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const debounce = useRef<number | undefined>(undefined);
  const callbacks = useRef(new Map<number, { resolve: (text: string) => void; reject: (error: Error) => void }>());
  const [analysis, setAnalysis] = useState<PayloadAnalysis | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const cancel = useCallback(() => {
    window.clearTimeout(debounce.current);
    worker.current?.terminate(); worker.current = null;
    callbacks.current.forEach(callback => callback.reject(new Error('cancelled'))); callbacks.current.clear();
    setBusy(false);
  }, []);
  useEffect(() => {
    cancel(); setAnalysis(null); setError('');
    if (!input.trim()) return;
    if (input.length > PAYLOAD_LIMIT) { setError('tooLarge'); return; }
    setBusy(true);
    const timer = window.setTimeout(() => {
      const active = new Worker(new URL('../workbench/payload.worker.ts', import.meta.url));
      worker.current = active;
      active.onmessage = (event: MessageEvent<{ id: number; type: string; analysis: PayloadAnalysis; text: string; error: string }>) => {
        if (worker.current !== active) return;
        const response = event.data;
        const callback = callbacks.current.get(response.id);
        if (callback) {
          callbacks.current.delete(response.id);
          if (response.type === 'error') callback.reject(new Error(response.error)); else callback.resolve(response.text);
        } else if (response.type === 'parse') { setAnalysis(response.analysis); setBusy(false); }
        else if (response.type === 'error') { setError(response.error); setBusy(false); }
      };
      active.onerror = () => { setError('invalid'); cancel(); };
      active.postMessage({ id: ++requestId.current, type: 'parse', input });
    }, 250);
    debounce.current = timer;
    return () => { window.clearTimeout(timer); cancel(); };
  }, [input, cancel]);
  const read = useCallback((path: PayloadPath, type = 'preview', minified = false) => new Promise<string>((resolve, reject) => {
    if (!worker.current) { reject(new Error('cancelled')); return; }
    const id = ++requestId.current;
    callbacks.current.set(id, { resolve, reject });
    worker.current.postMessage({ id, type, path, minified });
  }), []);
  return { analysis, error, busy, cancel, read };
}
