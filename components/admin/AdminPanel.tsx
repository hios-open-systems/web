'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import styles from './adminPanel.module.css';

interface UsageSummary {
    range: { days: number };
    totals: { events: number; pageViews: number; toolOpens: number; uniqueUsers: number };
    timeline: { day: string; event_name: string; count: number }[];
    topPages: { path: string; count: number }[];
    topTools: { toolId: string; count: number }[];
}

const DAY_OPTIONS = [7, 30, 90] as const;

/**
 * Panel del dueño. El gating REAL es server-side (los endpoints devuelven 403
 * si no sos el owner) — esta UI solo decide qué mostrar. Ruta sin link en la
 * navegación a propósito: /​{locale}/admin.
 */
export function AdminPanel() {
    const locale = useLocale();
    const { user, isLoading } = useCurrentUser();
    const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.isOwner) return;
        let cancelled = false;
        setError(null);
        fetch(`/api/usage/summary?days=${days}`, { credentials: 'same-origin' })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
            .then((data: UsageSummary) => {
                if (!cancelled) setSummary(data);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message === '503' ? 'D1 no disponible (¿dev local?)' : 'No se pudo cargar el resumen.');
            });
        return () => {
            cancelled = true;
        };
    }, [user?.isOwner, days]);

    if (isLoading) {
        return <main className={styles.page}><p className={styles.note}>…</p></main>;
    }

    if (!user?.isOwner) {
        // Misma cara para "no logueado" y "logueado pero no owner": no
        // confirmamos qué existe acá.
        return (
            <main className={styles.page}>
                <span className={`tech-label ${styles.kicker}`}>HIOS / ADMIN</span>
                <h1 className={styles.title}>403</h1>
                <p className={styles.note}>
                    Esta sección es del dueño del sitio.{' '}
                    {!user ? (
                        <a href={`/api/auth/github/start?next=/${locale}/admin`} className={styles.link}>
                            Iniciar sesión →
                        </a>
                    ) : null}
                </p>
            </main>
        );
    }

    const pageViewsByDay = new Map<string, number>();
    for (const row of summary?.timeline ?? []) {
        if (row.event_name === 'page_view') {
            pageViewsByDay.set(row.day, (pageViewsByDay.get(row.day) ?? 0) + row.count);
        }
    }
    const sparkDays = [...pageViewsByDay.entries()].sort(([a], [b]) => a.localeCompare(b));
    const maxDay = Math.max(1, ...sparkDays.map(([, c]) => c));

    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <span className={`tech-label ${styles.kicker}`}>HIOS / ADMIN</span>
                <h1 className={styles.title}>Panel</h1>
                <div className={styles.rangeRow} role="radiogroup" aria-label="Rango">
                    {DAY_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={days === option}
                            className={`${styles.rangeButton} ${days === option ? styles.rangeButtonActive : ''}`}
                            onClick={() => setDays(option)}
                        >
                            {option}d
                        </button>
                    ))}
                </div>
            </header>

            {error ? <p className={styles.note}>{error}</p> : null}

            {summary ? (
                <>
                    <section className={styles.tiles}>
                        {[
                            { label: 'Page views', value: summary.totals.pageViews },
                            { label: 'Tool opens', value: summary.totals.toolOpens },
                            { label: 'Eventos', value: summary.totals.events },
                            { label: 'Usuarios únicos', value: summary.totals.uniqueUsers },
                        ].map((tile) => (
                            <article key={tile.label} className={styles.tile}>
                                <span className={styles.tileValue}>{tile.value.toLocaleString()}</span>
                                <span className={styles.tileLabel}>{tile.label}</span>
                            </article>
                        ))}
                    </section>

                    {sparkDays.length > 0 ? (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Page views / día</h2>
                            <div className={styles.sparkRow}>
                                {sparkDays.map(([day, count]) => (
                                    <span
                                        key={day}
                                        className={styles.sparkBar}
                                        style={{ height: `${Math.max(6, Math.round((count / maxDay) * 100))}%` }}
                                        title={`${day}: ${count}`}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <div className={styles.twoCol}>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Top páginas</h2>
                            <ol className={styles.list}>
                                {summary.topPages.map((page) => (
                                    <li key={page.path} className={styles.listItem}>
                                        <span className={styles.listLabel}>{page.path}</span>
                                        <span className={styles.listValue}>{page.count}</span>
                                    </li>
                                ))}
                            </ol>
                        </section>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Top tools</h2>
                            <ol className={styles.list}>
                                {summary.topTools.map((tool) => (
                                    <li key={tool.toolId} className={styles.listItem}>
                                        <span className={styles.listLabel}>{tool.toolId}</span>
                                        <span className={styles.listValue}>{tool.count}</span>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>
                </>
            ) : null}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Accesos</h2>
                <div className={styles.linksRow}>
                    <Link href={`/${locale}/workbench/feedback`} className={styles.link}>
                        Feedback inbox →
                    </Link>
                    <Link href={`/${locale}/stats`} className={styles.link}>
                        Stats públicas →
                    </Link>
                    <a
                        href="https://github.com/hios-open-systems/web"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        Repo →
                    </a>
                    <a
                        href="https://dash.cloudflare.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        Cloudflare →
                    </a>
                </div>
            </section>
        </main>
    );
}
