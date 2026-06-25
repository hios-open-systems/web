'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { myPrints, recommendedPrints, printRepos, type PrintModel } from '@/config/prints';
import { PrinterOutlined, LinkOutlined } from '@ant-design/icons';

export function PrintsCatalog() {
    const { mode } = useTheme();
    const accent = '#f59e0b';
    const textColor = mode === 'dark' ? '#e6e6e6' : '#1a1a1a';
    const secondary = mode === 'dark' ? '#999' : '#666';
    const muted = mode === 'dark' ? '#666' : '#999';
    const cardBg = mode === 'dark' ? '#141414' : '#fafafa';
    const cardBorder = mode === 'dark' ? '1px solid #1f1f1f' : '1px solid #f0f0f0';

    const ModelCard = ({ m }: { m: PrintModel }) => (
        <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'block',
                padding: '16px 18px',
                background: cardBg,
                border: cardBorder,
                borderRadius: '12px',
                textDecoration: 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                <span style={{ color: muted, fontSize: 11, border: cardBorder, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                    {m.source}
                </span>
            </div>
            {m.author && (
                <div style={{ color: muted, fontSize: 12, marginTop: 4 }}>por {m.author}</div>
            )}
            <p style={{ color: secondary, fontSize: 14, lineHeight: 1.6, margin: '10px 0 0' }}>{m.description}</p>
            <div style={{ color: accent, fontSize: 13, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <LinkOutlined /> Ver modelo
            </div>
        </a>
    );

    const grid: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
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
                    buscar más. Crece a medida que publico cosas nuevas.
                </p>
            </section>

            {/* Mis piezas */}
            <section style={section}>
                <h2 style={h2}>Mis piezas</h2>
                {myPrints.length > 0 ? (
                    <div style={grid}>
                        {myPrints.map((m) => <ModelCard key={m.url} m={m} />)}
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
                        <a
                            key={r.url}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block', padding: '16px 18px', background: cardBg, border: cardBorder, borderRadius: 12, textDecoration: 'none' }}
                        >
                            <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>{r.name}</span>
                            <p style={{ color: secondary, fontSize: 14, lineHeight: 1.6, margin: '8px 0 0' }}>{r.description}</p>
                        </a>
                    ))}
                </div>
            </section>
        </main>
    );
}
