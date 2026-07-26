import React from 'react';
import nextDynamic from 'next/dynamic';
import { setRequestLocale } from 'next-intl/server';


const locales = ['en', 'es', 'de', 'it'];

export const dynamic = 'force-static';
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const HeroSection = nextDynamic(
  () => import('@/components/landing/HeroSection').then((mod) => ({ default: mod.HeroSection })),
  { ssr: true },
);

const HomeToolDeepLink = nextDynamic(
  () => import('@/components/landing/HomeToolDeepLink').then((mod) => ({ default: mod.HomeToolDeepLink })),
  { ssr: true },
);

const HeroRandomTool = nextDynamic(
  () => import('@/components/landing/HeroRandomTool').then((mod) => ({ default: mod.HeroRandomTool })),
  { ssr: true },
);

const ToolShowcase = nextDynamic(
  () => import('@/components/landing/ToolShowcase').then((mod) => ({ default: mod.ToolShowcase })),
  { ssr: true },
);

const ProjectsGrid = nextDynamic(
  () => import('@/components/landing/ProjectsGrid').then((mod) => ({ default: mod.ProjectsGrid })),
  { ssr: true },
);

const HomeQuickAccess = nextDynamic(
  () => import('@/components/landing/HomeQuickAccess').then((mod) => ({ default: mod.HomeQuickAccess })),
  { ssr: true },
);

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main>
      <React.Suspense fallback={null}>
        <HomeToolDeepLink />
      </React.Suspense>
      <HeroSection />
      <HeroRandomTool />
      <ProjectsGrid />
      <ToolShowcase />
      <HomeQuickAccess />
    </main>
  );
}
