import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeLayout } from '@/components/ThemeLayout';
import AntdRegistry from '@/lib/AntdRegistry';
import { theme } from '@/styles/theme';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HIOS Platform',
  description: 'Open Hardware/Software Initiative',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ThemeLayout>
            {children}
          </ThemeLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
