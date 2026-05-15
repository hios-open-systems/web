import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ThemeSettings } from '@/components/settings/ThemeSettings';

export const metadata: Metadata = {
    title: 'Settings | HIOS Workbench',
    description: 'Configurá el tema y otras preferencias del workbench.',
};

export const runtime = 'edge';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function WorkbenchSettingsPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 56px' }}>
            <ThemeSettings />
        </main>
    );
}
