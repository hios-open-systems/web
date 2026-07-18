'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { myPrints, recommendedPrints, printRepos, type PrintModel } from '@/config/prints';
import { PrinterOutlined, LinkOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { StlViewerLazy } from './StlViewerLazy';

export function PrintsCatalog() {
    const { mode } = useTheme();
    const accent = '#f59e0b';
    const textColor = mode === 'dark' ? '#e6e6e6' : '#1a1a1a';
    const secondary = mode === 'dark' ? '#999' : '#666';
    const muted = mode === 'dark' ? '#666' : '#999';
    const cardBg = mode === 'dark' ? '#141414' : '#fafafa';
    const cardBorder = mode === 'dark' ? '1px solid #1f1f1f' : '1px solid #f0f0f0';

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
    const actionBtn: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        padding: '7px 12px', borderRadius: 8, cursor: 'pointer', textDecoration: 'none',
    };

    const ModelCard = ({ m }: { m: PrintModel }) => {
        const head = (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                <span style={chipStyle}>{m.source}</span>
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
                            style={{ ...actionBtn, background: 'transparent', color: accent, border: `1px solid ${accent}` }}
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
                <div style={{ color: accent, fontSize: 13, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
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

    return (
        <main style={{ background: mode === 'dark' ? '#0d0d0d' : '#fff', minHeight: '100vh', paddingTop: 8 }}>
            <section style={{ maxWidth: 980, margin: '0 auto', padding: '24px 24px 32px' }}>
                <h1 style={{ color: textColor, fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PrinterOutlined style={{ color: accent }} /> Maker / Prints
                </h1>
                <p style={{ color: secondary, fontSize: 17, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
                    Piezas que diseñé o imprimí, modelos de la comunidad que vale la pena tener a mano, y dónde
                    buscar más. Las piezas propias se ven en 3D y se descargan directo.
                </p>
            </section>

            {/* Mis piezas */}
            <section style={section}>
                <h2 style={h2}>Mis piezas</h2>
                {myPrints.length > 0 ? (
                    <div style={grid}>
                        {myPrints.map((m) => <ModelCard key={m.file ?? m.url} m={m} />)}
                    </div>
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
                        style={{ width: 'min(920px, 100%)', height: 'min(78vh, 720px)', background: mode === 'dark' ? '#0d0d0d' : '#fff', border: cardBorder, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: cardBorder }}>
                            <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{active.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <a href={active.file} download style={{ color: accent, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
