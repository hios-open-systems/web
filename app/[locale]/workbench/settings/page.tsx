import { translatedMetadata } from '@/lib/seo-metadata';
import { setRequestLocale } from 'next-intl/server';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { ThemeSettings } from '@/components/settings/ThemeSettings';

export const generateMetadata = translatedMetadata('/workbench/settings', 'Settings', 'subtitle');


interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function WorkbenchSettingsPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 56px' }}>
            <ThemeSettings />
            <PrivacySettings />
        </main>
    );
}
