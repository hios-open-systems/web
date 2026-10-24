'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { turnstileEnabled } from './TurnstileWidget';

/** Start verification only from the form's explicit submit action. */
export function useTurnstileVerification() {
  const [requestId, setRequestId] = useState(0);
  const pending = useRef<((token: string | null) => void) | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onToken = useCallback((token: string | null) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    const resolve = pending.current;
    pending.current = null;
    resolve?.(token);
  }, []);
  const cancel = useCallback(() => {
    onToken(null);
    setRequestId(0);
  }, [onToken]);
  useEffect(() => () => onToken(null), [onToken]);
  const verify = useCallback((): Promise<string | null> => {
    if (!turnstileEnabled()) return Promise.resolve(null);
    onToken(null);
    return new Promise(resolve => {
      pending.current = resolve;
      timeout.current = setTimeout(() => onToken(null), 120_000);
      setRequestId(value => value + 1);
    });
  }, [onToken]);
  return { requestId, onToken, verify, cancel };
}
