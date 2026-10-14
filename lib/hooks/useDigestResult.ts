'use client';
import { useEffect, useState } from 'react';
import { digest, type HashAlgorithm } from '@/lib/workbench/hash';
import { hmac } from '@/lib/workbench/hmac';
type Result = { hex: string; base64: string };
export function useDigestResult(algo: HashAlgorithm, input: string, secret?: string) {
  const key = JSON.stringify([algo, input, secret]);
  const [state, setState] = useState<{ key: string; result?: Result; error?: boolean }>({ key: '' });
  useEffect(() => {
    let cancelled = false;
    if (secret === '') return;
    const task = secret === undefined ? digest(algo, input) : hmac(algo, secret, input);
    task.then(result => { if (!cancelled) setState({ key, result }); })
      .catch(() => { if (!cancelled) setState({ key, error: true }); });
    return () => { cancelled = true; };
  }, [algo, input, secret, key]);
  return {
    result: state.key === key ? state.result : undefined,
    error: state.key === key && state.error,
    pending: secret !== '' && state.key !== key,
    missingKey: secret === '',
  };
}
