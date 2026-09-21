'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ToolOutlined, ThunderboltOutlined, ReadOutlined, LineChartOutlined } from '@ant-design/icons';

type Bi = { es: string; en: string };

const ITEMS: { href: string; icon: React.ReactNode; label: Bi; desc: Bi }[] = [
    { href: 'workbench', icon: <ToolOutlined />, label: { es: 'Workbench', en: 'Workbench' }, desc: { es: 'Utilitarios locales para developers, hardware y redes.', en: 'Local utilities for developers, hardware, and networks.' } },
    { href: 'projects/hios-node-ai', icon: <ThunderboltOutlined />, label: { es: 'IA Local', en: 'Local AI' }, desc: { es: 'Puente ESP32 a Ollama/llama.cpp. Cero nube.', en: 'ESP32 bridge to Ollama/llama.cpp. Zero cloud.' } },
    { href: 'blog', icon: <ReadOutlined />, label: { es: 'Devlog', en: 'Devlog' }, desc: { es: 'Notas técnicas y tutoriales de lo que voy construyendo.', en: 'Technical notes and tutorials on what I build.' } },
    { href: 'stats', icon: <LineChartOutlined />, label: { es: 'Métricas', en: 'Open Stats' }, desc: { es: 'Telemetría anónima y pública. Privacidad ante todo.', en: 'Anonymous, public telemetry. Privacy first.' } },
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
