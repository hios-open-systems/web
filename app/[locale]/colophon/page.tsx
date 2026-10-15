import { PageIntro } from '@/components/ui/PageIntro';
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
      <PageIntro eyebrow="HIOS / DOC-META-01" title={t('title')} area="knowledge" compact />
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
