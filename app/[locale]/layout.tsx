import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Archivo, IBM_Plex_Mono } from 'next/font/google';
import { ThemeLayout } from '@/components/ThemeLayout';
import AntdRegistry from '@/lib/AntdRegistry';
import { getCurrentDeployVersion } from '@/lib/appVersion';
// @ts-expect-error Global stylesheet is imported for its side effects without a module declaration.
import '@/styles/globals.css';
// @ts-expect-error Excalidraw ships this stylesheet without a CSS module declaration.
import '@excalidraw/excalidraw/index.css';

import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const archivo = Archivo({
  subsets: ['latin'],
  display: 'optional',
  weight: ['500', '600', '700'],
  variable: '--font-display',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#0b1220',
  width: 'device-width',
  initialScale: 1,
};

const SITE_URL = (process.env.AUTH_BASE_URL || 'https://openhios.dev').replace(/\/$/, '');

const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var stored=localStorage.getItem('theme');var next=(stored==='light'||stored==='dark')?stored:null;if(!next&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){next='dark';}if(!next){next='dark';}document.documentElement.setAttribute('data-theme',next);var skin=localStorage.getItem('hios-skin');if(skin==='terminal'||skin==='blueprint'||skin==='datasheet'){document.documentElement.setAttribute('data-skin',skin);}}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

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

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  // Guard antes de cualquier render caro: locale inválido → 404 barato (app/not-found.tsx),
  // no la home completa. Corta el CPU que gastaban los escáneres de /*.php.
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="dark" data-skin="datasheet" suppressHydrationWarning>
      <head>
        {/* Miga para curiosos: todo el código es público, no hay nada escondido. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <meta name="source" content="https://github.com/hios-open-systems/web" />
        <link rel="author" href="/humans.txt" />
      </head>
      {/* Sin inter.className: la font del body la decide var(--font-stack-sans),
          que los skins pueden overridear (terminal = todo mono). */}
      <body className={`${inter.variable} ${archivo.variable} ${plexMono.variable}`}>
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
