'use client';
import { useCallback, useEffect, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export interface PasskeyStatus { verified: boolean; passkeys: number; canEnroll: boolean }

async function post(step: string, response?: unknown) {
  const res = await fetch('/api/admin/passkey', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ step, response }),
  });
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'error');
  return res.json();
}

export function usePasskeyGate(enabled: boolean) {
  const [status, setStatus] = useState<PasskeyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => {
    if (!enabled) return;
    fetch('/api/admin/passkey', { cache: 'no-store' }).then(res => res.ok ? res.json() : Promise.reject(new Error('status')))
      .then((value: PasskeyStatus) => setStatus(value)).catch(() => setError('No se pudo consultar el estado.'));
  }, [enabled]);
  useEffect(refresh, [refresh]);
  const run = useCallback(async (kind: 'register' | 'login') => {
    setBusy(true); setError(null);
    try {
      const optionsJSON = await post(`${kind}-options`);
      const response = kind === 'register' ? await startRegistration({ optionsJSON }) : await startAuthentication({ optionsJSON });
      await post(`${kind}-verify`, response);
      refresh();
    } catch (cause) {
      setError(cause instanceof Error && cause.name === 'NotAllowedError' ? 'Cancelado.' : 'No se pudo verificar la passkey.');
    } finally { setBusy(false); }
  }, [refresh]);
  const lock = useCallback(async () => { await post('logout').catch(() => null); refresh(); }, [refresh]);
  return { status, error, busy, register: () => run('register'), login: () => run('login'), lock };
}
