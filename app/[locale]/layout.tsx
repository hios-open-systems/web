import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeLayout } from '@/components/ThemeLayout';
import AntdRegistry from '@/lib/AntdRegistry';
import { getCurrentDeployVersion } from '@/lib/appVersion';
import '@/styles/globals.css';
import '@excalidraw/excalidraw/index.css';

import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#0b1220',
  width: 'device-width',
  initialScale: 1,
};

const SITE_URL = (process.env.AUTH_BASE_URL || 'https://openhios.dev').replace(/\/$/, '');
const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var stored=localStorage.getItem('theme');var next=(stored==='light'||stored==='dark')?stored:null;if(!next&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){next='dark';}if(!next){next='dark';}document.documentElement.setAttribute('data-theme',next);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Locale inválido (ej. escáneres pidiendo /backup.php, que matchea /[locale]) → 404.
  // Sin esto, i18n cae a 'en' en silencio y se renderiza la home entera (CPU → 1102).
  if (!hasLocale(routing.locales, locale)) notFound();
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
      // Imágenes OG pre-renderadas (public/og/<locale>.png). Antes se generaban
      // en runtime con next/og (satori+resvg ~1.4MB), que quedaba embebido en el
      // bundle del Worker y engordaba el cold-start (causa del Error 1102). Ahora
      // son estáticas, servidas desde ASSETS. Para regenerarlas ver scripts/gen-og.mjs.
      images: [{ url: `/og/${locale}.png`, width: 1200, height: 630, alt: 'HIOS — open workbench' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/og/${locale}.png`] },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
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

// Locales fuera de esta lista (ej. /backup.php, /info.php.bak — todos matchean
// /[locale]) → 404 en el ROUTER, sin bootear este layout ni el cold-start del
// Worker. El guard notFound() de abajo corre demasiado tarde (ya cargó el módulo
// con antd/excalidraw/font/etc.); esto corta antes y mata el CPU (Error 1102) que
// gastan los escáneres de /*.php al golpear isolates fríos.
export const dynamicParams = false;

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  // Guard antes de cualquier render caro: locale inválido → 404 barato (app/not-found.tsx),
  // no la home completa. Corta el CPU que gastaban los escáneres de /*.php.
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className={inter.className}>
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
