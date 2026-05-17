import React from 'react';
import dynamic from 'next/dynamic';
import { setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const HeroSection = dynamic(
  () => import('@/components/landing/HeroSection').then((mod) => ({ default: mod.HeroSection })),
  { ssr: true },
);

const HomeToolDeepLink = dynamic(
  () => import('@/components/landing/HomeToolDeepLink').then((mod) => ({ default: mod.HomeToolDeepLink })),
  { ssr: true },
);

const ToolShowcase = dynamic(
  () => import('@/components/landing/ToolShowcase').then((mod) => ({ default: mod.ToolShowcase })),
  { ssr: true },
);

const ProjectsGrid = dynamic(
  () => import('@/components/landing/ProjectsGrid').then((mod) => ({ default: mod.ProjectsGrid })),
  { ssr: true },
);

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <main>
      <HomeToolDeepLink />
      <HeroSection />
      <ToolShowcase />
      <ProjectsGrid />
    </main>
  );
}
