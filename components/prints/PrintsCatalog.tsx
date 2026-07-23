'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { myPrints, recommendedPrints, printRepos, printProjectMeta, type PrintModel } from '@/config/prints';
import { WIRING_GUIDE_SLUGS } from '@/config/pinouts/guides';
import { PrinterOutlined, LinkOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { StlViewerLazy } from './StlViewerLazy';

/** Clave interna para las piezas sin proyecto asignado. */
const LOOSE_GROUP = '__loose__';

/** Agrupa las piezas propias por proyecto, preservando el orden de config/prints.ts. */
function groupPrintsByProject(models: PrintModel[]): Array<[string, PrintModel[]]> {
    const groups = new Map<string, PrintModel[]>();
    for (const m of models) {
        const key = m.project ?? LOOSE_GROUP;
        const bucket = groups.get(key);
        if (bucket) bucket.push(m);
        else groups.set(key, [m]);
    }
    // Sueltas siempre al final.
    return [...groups.entries()].sort(([a], [b]) => Number(a === LOOSE_GROUP) - Number(b === LOOSE_GROUP));
}

export function PrintsCatalog() {
    const locale = useLocale();
    const accent = 'var(--hios-accent)';
    const accentText = 'var(--accent-text)';
    const textColor = 'var(--hios-text)';
    const secondary = 'var(--hios-text-secondary)';
    const muted = 'var(--hios-text-muted)';
    const cardBg = 'var(--hios-bg-secondary)';
    const cardBorder = '1px solid var(--hios-border)';

    // Modelo abierto en el visor 3D (null = modal cerrado).
    const [active, setActive] = useState<PrintModel | null>(null);

    // Cerrar con Esc y bloquear el scroll del body mientras el modal está abierto.
    useEffect(() => {
        if (!active) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [active]);

    const chipStyle: React.CSSProperties = {
        color: muted, fontSize: 11, border: cardBorder, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap',
    };
    const categoryStyle: React.CSSProperties = {
        color: muted,
        fontFamily: 'var(--font-stack-mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    };
    const actionBtn: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        padding: '7px 12px', borderRadius: 8, cursor: 'pointer', textDecoration: 'none',
    };

    const ModelCard = ({ m }: { m: PrintModel }) => {
        const head = (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                {m.category
                    ? <span style={categoryStyle}>{m.category}</span>
                    : <span style={chipStyle}>{m.source}</span>}
            </div>
        );
        const meta = (
            <>
                {m.author && <div style={{ color: muted, fontSize: 12, marginTop: 4 }}>por {m.author}</div>}
                <p style={{ color: secondary, fontSize: 14, lineHeight: 1.6, margin: '10px 0 0' }}>{m.description}</p>
            </>
        );

        // Pieza propia con archivo: visor 3D + descarga, todo client-side.
        if (m.file) {
            return (
                <div style={{ padding: '16px 18px', background: cardBg, border: cardBorder, borderRadius: 12 }}>
                    {head}
                    {meta}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setActive(m)}
                            style={{ ...actionBtn, background: accent, color: '#1a1a1a', border: 'none' }}
                        >
                            <PrinterOutlined /> Ver en 3D
                        </button>
                        <a
                            href={m.file}
                            download
                            style={{ ...actionBtn, background: 'transparent', color: accentText, border: `1px solid ${accentText}` }}
                        >
                            <DownloadOutlined /> Descargar STL{m.fileKB ? ` (${m.fileKB} KB)` : ''}
                        </a>
                    </div>
                </div>
            );
        }

        // Modelo externo (Thingiverse/etc): card-link, como antes.
        return (
            <a href={m.url} target="_blank" rel="noopener noreferrer"
               style={{ display: 'block', padding: '16px 18px', background: cardBg, border: cardBorder, borderRadius: 12, textDecoration: 'none' }}>
                {head}
                {meta}
                <div style={{ color: accentText, fontSize: 13, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LinkOutlined /> Ver modelo
                </div>
            </a>
        );
    };

    const grid: React.CSSProperties = {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16,
    };
    const h2: React.CSSProperties = { color: textColor, fontSize: 20, fontWeight: 600, margin: '0 0 16px' };
    const section: React.CSSProperties = { maxWidth: 980, margin: '0 auto', padding: '0 24px 48px' };
    const groupLink: React.CSSProperties = {
        color: accentText, fontSize: 13, fontWeight: 600, textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 4,
    };

    const printGroups = groupPrintsByProject(myPrints);

    return (
        <main style={{ background: 'var(--hios-bg)', minHeight: '100vh', paddingTop: 8 }}>
            <section style={{ maxWidth: 980, margin: '0 auto', padding: '24px 24px 32px' }}>
                <h1 style={{ color: textColor, fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PrinterOutlined style={{ color: accentText }} /> Maker / Prints
                </h1>
                <p style={{ color: secondary, fontSize: 17, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
                    Las piezas imprimibles de cada proyecto de hardware —carcasas, soportes y accesorios—,
                    modelos de la comunidad que vale la pena tener a mano, y dónde buscar más. Las piezas
                    propias se ven en 3D y se descargan directo.
                </p>
            </section>

            {/* Piezas propias, agrupadas por proyecto */}
            <section style={section}>
                {myPrints.length > 0 ? (
                    printGroups.map(([groupKey, models]) => {
                        const isLoose = groupKey === LOOSE_GROUP;
                        const meta = isLoose ? undefined : printProjectMeta[groupKey];
                        return (
                            <div
                                key={groupKey}
                                id={isLoose ? 'prints-sueltas' : `prints-${groupKey}`}
                                style={{ scrollMarginTop: 80, marginBottom: 40 }}
                            >
                                <div style={{ borderBottom: cardBorder, paddingBottom: 14, marginBottom: 20 }}>
                                    {!isLoose && (
                                        <span className="tech-label" style={{ color: accentText, display: 'block', marginBottom: 8 }}>
                                            PROYECTO / {groupKey.toUpperCase()}
                                        </span>
                                    )}
                                    <h2 style={{ ...h2, margin: '0 0 6px' }}>
                                        {isLoose ? 'Sueltas' : (meta?.name ?? groupKey.toUpperCase())}
                                    </h2>
                                    <p style={{ color: secondary, fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
                                        {isLoose
                                            ? 'Piezas que no pertenecen a ningún proyecto en particular.'
                                            : (meta?.blurb ?? '')}
                                    </p>
                                    {!isLoose && (
                                        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                                            <Link href={`/${locale}/projects/${groupKey}`} style={groupLink}>
                                                Ver proyecto →
                                            </Link>
                                            {WIRING_GUIDE_SLUGS.includes(groupKey) && (
                                                <Link href={`/${locale}/pinouts/${groupKey}`} style={groupLink}>
                                                    Wiring →
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={grid}>
                                    {models.map((m) => <ModelCard key={m.file ?? m.url ?? m.name} m={m} />)}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ padding: '20px', background: cardBg, border: cardBorder, borderRadius: 12, color: muted, fontSize: 14 }}>
                        Próximamente: acá van a ir mis modelos publicados. (Se editan en <code style={{ color: secondary }}>config/prints.ts</code>.)
                    </div>
                )}
            </section>

            {/* Recomendados de la comunidad */}
            {recommendedPrints.length > 0 && (
                <section style={section}>
                    <h2 style={h2}>Recomendados de la comunidad</h2>
                    <div style={grid}>
                        {recommendedPrints.map((m) => <ModelCard key={m.url} m={m} />)}
                    </div>
                </section>
            )}

            {/* Dónde buscar */}
            <section style={section}>
                <h2 style={h2}>Dónde buscar modelos</h2>
                <div style={grid}>
                    {printRepos.map((r) => (
                        <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'block', padding: '16px 18px', background: cardBg, border: cardBorder, borderRadius: 12, textDecoration: 'none' }}>
                            <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{r.name}</span>
                            <p style={{ color: secondary, fontSize: 14, lineHeight: 1.6, margin: '8px 0 0' }}>{r.description}</p>
                        </a>
                    ))}
                </div>
            </section>

            {/* Modal del visor 3D */}
            {active?.file && (
                <div
                    onClick={() => setActive(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', padding: 'clamp(12px, 4vw, 48px)' }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 'min(920px, 100%)', height: 'min(78vh, 720px)', background: 'var(--hios-bg)', border: cardBorder, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: cardBorder }}>
                            <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{active.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <a href={active.file} download style={{ color: accentText, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <DownloadOutlined /> Descargar
                                </a>
                                <button type="button" onClick={() => setActive(null)} aria-label="Cerrar"
                                        style={{ background: 'transparent', border: 'none', color: secondary, cursor: 'pointer', fontSize: 18, display: 'grid', placeItems: 'center' }}>
                                    <CloseOutlined />
                                </button>
                            </div>
                        </div>
                        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                            <StlViewerLazy url={active.file} name={active.name} />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
