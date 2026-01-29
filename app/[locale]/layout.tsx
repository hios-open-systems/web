import React from 'react';
import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import { ThemeLayout } from '@/components/ThemeLayout';
import AntdRegistry from '@/lib/AntdRegistry';
import '@/styles/globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HIOS Platform',
  description: 'Open Hardware/Software Initiative',
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      {/* <body className={inter.className}> */}
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <NextIntlClientProvider messages={messages}>
          <AntdRegistry>
            <ThemeLayout>
              {children}
            </ThemeLayout>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
