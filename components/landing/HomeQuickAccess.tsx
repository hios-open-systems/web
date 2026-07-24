'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CalculatorOutlined, ApiOutlined, PrinterOutlined, ReadOutlined } from '@ant-design/icons';

type Bi = { es: string; en: string };

const ITEMS: { href: string; icon: React.ReactNode; label: Bi; desc: Bi }[] = [
    { href: 'calculators', icon: <CalculatorOutlined />, label: { es: 'Calculadoras', en: 'Calculators' }, desc: { es: 'Resistencias, I2S, RC y más — en el navegador.', en: 'Resistors, I2S, RC and more — in the browser.' } },
    { href: 'pinouts', icon: <ApiOutlined />, label: { es: 'Pinouts', en: 'Pinouts' }, desc: { es: 'Visor interactivo de pinouts de módulos.', en: 'Interactive module pinout viewer.' } },
    { href: 'prints', icon: <PrinterOutlined />, label: { es: 'Maker', en: 'Maker' }, desc: { es: 'Modelos 3D propios y de la comunidad.', en: 'My 3D models and community picks.' } },
    { href: 'blog', icon: <ReadOutlined />, label: { es: 'Devlog', en: 'Devlog' }, desc: { es: 'Notas técnicas de lo que voy construyendo.', en: 'Technical notes on what I build.' } },
];

export function HomeQuickAccess() {
    const locale = useLocale();
    const pick = (m: Bi) => (locale === 'en' ? m.en : m.es);
    // CSS vars, no `mode`: el SSR pinta siempre dark y React no parchea estilos
    // inline en la hidratación — el usuario en light quedaba con las tarjetas
    // oscuras. Las vars además siguen al skin activo.
    const textColor = 'var(--hios-text)';
    const secondary = 'var(--hios-text-secondary)';
    const cardBg = 'var(--hios-bg-elevated)';
    const cardBorder = '1px solid var(--hios-border)';
    const accent = 'var(--accent, #f59e0b)';

    return (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 56px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {ITEMS.map((it) => (
                    <Link
                        key={it.href}
                        href={`/${locale}/${it.href}`}
                        prefetch={false}
                        style={{ display: 'block', padding: 20, background: cardBg, border: cardBorder, borderRadius: 14, textDecoration: 'none' }}
                    >
                        <div style={{ color: accent, fontSize: 22, marginBottom: 10 }}>{it.icon}</div>
                        <div style={{ color: textColor, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{pick(it.label)}</div>
                        <div style={{ color: secondary, fontSize: 13, lineHeight: 1.5 }}>{pick(it.desc)}</div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
