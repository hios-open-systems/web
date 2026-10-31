'use client';
import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { usePasskeyGate } from '@/lib/hooks/usePasskeyGate';
import styles from './adminPanel.module.css';

type Gate = ReturnType<typeof usePasskeyGate>;

function PasskeyStep({ next, gate }: { next: string; gate: Gate }) {
  const locale = useLocale();
  const { status, error, busy, register, login } = gate;
  if (!status) return null;
  const relogin = `/api/auth/github/start?next=/${locale}${next}`;
  return <main className={styles.page}>
    <header className={styles.head}><span className={'tech-label ' + styles.kicker}>HIOS / ADMIN</span>
      <h1 className={styles.title}>Verificación</h1></header>
    {status.passkeys > 0 ? <>
      <p>Confirmá que sos vos con tu passkey (huella, cara o PIN del dispositivo).</p>
      <button type="button" className={styles.rangeButton + ' ' + styles.rangeButtonActive} disabled={busy} onClick={login}>Verificar con passkey</button>
    </> : status.canEnroll ? <>
      <p>Todavía no hay passkey. Registrá una en este dispositivo; después solo esa passkey abre el admin.</p>
      <button type="button" className={styles.rangeButton + ' ' + styles.rangeButtonActive} disabled={busy} onClick={register}>Registrar passkey</button>
    </> : <p className={styles.note}>Para registrar la primera passkey hace falta un inicio de sesión reciente (15 min).{' '}
      <a href={relogin}>Volver a entrar con GitHub →</a></p>}
    {error ? <p className={styles.note}>{error}</p> : null}
  </main>;
}

/** Owner (GitHub session) + passkey step-up. Sensitive APIs enforce the same on the server. */
export function AdminGate({ next, children }: { next: string; children: ReactNode }) {
  const locale = useLocale();
  const { user, isLoading } = useCurrentUser();
  const gate = usePasskeyGate(!!user?.isOwner);
  if (isLoading) return <main className={styles.page}><p>…</p></main>;
  if (!user?.isOwner) return <main className={styles.page}><h1>403</h1><p>Esta sección es del dueño del sitio.</p>
    {!user ? <a href={`/api/auth/github/start?next=/${locale}${next}`}>Iniciar sesión →</a> : null}</main>;
  if (!gate.status) return <main className={styles.page}><p>{gate.error ?? '…'}</p></main>;
  if (!gate.status.verified) return <PasskeyStep next={next} gate={gate} />;
  return <>{children}<div className={styles.page} style={{ paddingTop: 0 }}>
    <button type="button" className={styles.rangeButton} onClick={gate.lock}>Bloquear admin</button></div></>;
}

export function RangePicker({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return <div className={styles.rangeRow} role="radiogroup" aria-label="Rango">{[1, 7, 14, 30, 90].map(value =>
    <button key={value} type="button" role="radio" aria-checked={value === days} onClick={() => onChange(value)}
      className={styles.rangeButton + (value === days ? ' ' + styles.rangeButtonActive : '')}>{value}d</button>)}</div>;
}
