'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './publicStats.module.css';

interface StatsPayload {
    rangeDays: number;
    totals: { pageViews: number; toolOpens: number; guestbook: number };
    perDay: { day: string; count: number }[];
    topTools: { toolId: string; count: number }[];
    countries: { country: string; count: number }[];
    locales: { locale: string; count: number }[];
}

/** 'AR' → 🇦🇷 (regional indicator symbols). */
function countryFlag(code: string): string {
    if (!/^[A-Za-z]{2}$/.test(code)) return '·';
    return String.fromCodePoint(
        ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
    );
}

function Bar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
    return (
        <span className={styles.barTrack} aria-hidden>
            <span className={styles.barFill} style={{ width: `${pct}%` }} />
        </span>
    );
}

export function PublicStats() {
    const locale = useLocale();
    const t = useTranslations('PublicStats');
    const tools = useTranslations('Workbench.packs');
    const [data, setData] = useState<StatsPayload | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/stats/public')
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
            .then((payload: StatsPayload) => {
                if (!cancelled) setData(payload);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const maxDay = data ? Math.max(1, ...data.perDay.map((d) => d.count)) : 1;
    const maxTool = data ? Math.max(1, ...data.topTools.map((d) => d.count)) : 1;
    const maxCountry = data ? Math.max(1, ...data.countries.map((d) => d.count)) : 1;
    const isEmpty =
        data && data.totals.pageViews === 0 && data.totals.toolOpens === 0 && data.totals.guestbook === 0;

    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <span className={`tech-label ${styles.kicker}`}>{t('kicker')}</span>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.intro}>{t('intro')}</p>
            </header>

            {failed ? <p className={styles.note}>{t('error')}</p> : null}
            {isEmpty ? <p className={styles.note}>{t('empty')}</p> : null}

            {data && !isEmpty ? (
                <>
                    <section className={styles.tiles}>
                        <article className={styles.tile}>
                            <span className={styles.tileValue}>{data.totals.pageViews.toLocaleString(locale)}</span>
                            <span className={styles.tileLabel}>{t('pageViews')}</span>
                            <span className={styles.tileHint}>{t('lastDays', { days: data.rangeDays })}</span>
                        </article>
                        <article className={styles.tile}>
                            <span className={styles.tileValue}>{data.totals.toolOpens.toLocaleString(locale)}</span>
                            <span className={styles.tileLabel}>{t('toolOpens')}</span>
                            <span className={styles.tileHint}>{t('lastDays', { days: data.rangeDays })}</span>
                        </article>
                        <article className={styles.tile}>
                            <span className={styles.tileValue}>{(data.totals.guestbook ?? 0).toLocaleString(locale)}</span>
                            <span className={styles.tileLabel}>{t('guestbook')}</span>
                            <span className={styles.tileHint}>{t('allTime')}</span>
                        </article>
                    </section>

                    {data.perDay.length > 0 ? (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t('activity')}</h2>
                            <div className={styles.sparkRow} role="img" aria-label={t('activity')}>
                                {data.perDay.map((d) => (
                                    <span
                                        key={d.day}
                                        className={styles.sparkBar}
                                        style={{ height: `${Math.max(6, Math.round((d.count / maxDay) * 100))}%` }}
                                        title={`${d.day}: ${d.count}`}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {data.topTools.length > 0 ? (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>{t('topTools')}</h2>
                            <ul className={styles.rows}>
                                {data.topTools.map((tool) => (
                                    <li key={tool.toolId} className={styles.row}>
                                        <span className={styles.rowLabel}>{tools.has(`${tool.toolId}.title`) ? tools(`${tool.toolId}.title`) : tool.toolId}</span>
                                        <Bar value={tool.count} max={maxTool} />
                                        <span className={styles.rowValue}>{tool.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <div className={styles.twoCol}>
                        {data.countries.length > 0 ? (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>{t('countries')}</h2>
                                <ul className={styles.rows}>
                                    {data.countries.map((c) => (
                                        <li key={c.country} className={styles.row}>
                                            <span className={styles.rowLabel}>
                                                {countryFlag(c.country)} {c.country}
                                            </span>
                                            <Bar value={c.count} max={maxCountry} />
                                            <span className={styles.rowValue}>{c.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}
                        {data.locales.length > 0 ? (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>{t('locales')}</h2>
                                <div className={styles.chips}>
                                    {data.locales.map((l) => (
                                        <span key={l.locale} className={styles.chip}>
                                            {l.locale} · {l.count}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </div>
                </>
            ) : null}
        </main>
    );
}
