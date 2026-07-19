import React from 'react';
import dynamic from 'next/dynamic';
import { setRequestLocale } from 'next-intl/server';


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

const HeroRandomTool = dynamic(
  () => import('@/components/landing/HeroRandomTool').then((mod) => ({ default: mod.HeroRandomTool })),
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

const HomeQuickAccess = dynamic(
  () => import('@/components/landing/HomeQuickAccess').then((mod) => ({ default: mod.HomeQuickAccess })),
  { ssr: true },
);

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main>
      {/* useSearchParams() (deep-link a tools) necesita Suspense para no romper el
          prerender estático en Next 15 (CSR bailout). Antes lo tapaba runtime=edge. */}
      <React.Suspense fallback={null}>
        <HomeToolDeepLink />
      </React.Suspense>
      <HeroSection />
      <HeroRandomTool />
      {/* Proyectos con más prioridad (arriba de las tools). */}
      <ProjectsGrid />
      {/* Pantallazo de 8 herramientas + "ver todas". */}
      <ToolShowcase />
      {/* Accesos: calculadoras, pinouts, Maker, Devlog. */}
      <HomeQuickAccess />
    </main>
  );
}
