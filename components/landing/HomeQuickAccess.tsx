'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ToolOutlined, ThunderboltOutlined, ReadOutlined, LineChartOutlined, PrinterOutlined } from '@ant-design/icons';

const ITEMS = [
    { id: 'workbench', href: 'workbench', icon: <ToolOutlined /> },
    { id: 'maker', href: 'prints', icon: <PrinterOutlined /> },
    { id: 'ai', href: 'projects/hios-node-ai', icon: <ThunderboltOutlined /> },
    { id: 'blog', href: 'blog', icon: <ReadOutlined /> },
    { id: 'stats', href: 'stats', icon: <LineChartOutlined /> },
];


export function HomeQuickAccess() {
    const locale = useLocale();
    const t = useTranslations('HomeQuickAccess');
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
                        <div style={{ color: textColor, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t(`${it.id}.label`)}</div>
                        <div style={{ color: secondary, fontSize: 13, lineHeight: 1.5 }}>{t(`${it.id}.description`)}</div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
