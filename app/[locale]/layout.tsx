import React from 'react';
import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import { ThemeLayout } from '@/components/ThemeLayout';
import AntdRegistry from '@/lib/AntdRegistry';
import { getCurrentDeployVersion } from '@/lib/appVersion';
import '@/styles/globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

// const inter = Inter({ subsets: ['latin'] });

const SITE_URL = (process.env.AUTH_BASE_URL || 'https://openhios.dev').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Hero' });
  const title = `HIOS — ${t('title')}`;
  const description = t('subtitle');
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: 'HIOS',
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', es: '/es', de: '/de', it: '/it', 'x-default': '/en' },
    },
    openGraph: {
      type: 'website',
      siteName: 'HIOS',
      url: `${SITE_URL}/${locale}`,
      title,
      description,
      locale,
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
    icons: { icon: '/favicon.ico' },
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

import { setRequestLocale } from 'next-intl/server';

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      {/* <body className={inter.className}> */}
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <NextIntlClientProvider messages={messages}>
          <AntdRegistry>
            <ThemeLayout currentVersion={getCurrentDeployVersion()}>
              {children}
            </ThemeLayout>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
