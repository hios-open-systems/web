import { translatedMetadata } from '@/lib/seo-metadata';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-static';
export function generateStaticParams() {
    return ['en', 'es', 'de', 'it'].map((locale) => ({ locale }));
}

export const generateMetadata = translatedMetadata('/colophon', 'Seo.colophon', 'description');

export default async function ColophonPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Colophon');

    return (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
            <p style={{ fontFamily: 'var(--font-stack-mono)', fontSize: 12, color: 'var(--accent-text)', margin: 0 }}>
                HIOS / DOC-META-01
            </p>
            <h1 style={{ fontFamily: 'var(--font-stack-display)', fontSize: 40, color: 'var(--hios-text)', margin: '8px 0 0' }}>
                {t('title')}
            </h1>
            {[0, 1, 2, 3].map((index) => (
                <section key={index} style={{ marginTop: 28 }}>
                    <h2 style={{ fontFamily: 'var(--font-stack-display)', fontSize: 20, color: 'var(--hios-text)', margin: 0 }}>
                        {t(`sections.${index}.heading`)}
                    </h2>
                    <p style={{ color: 'var(--hios-text-secondary)', lineHeight: 1.7, margin: '10px 0 0' }}>
                        {t(`sections.${index}.body`)}
                    </p>
                </section>
            ))}
        </main>
    );
}
