import { translatedMetadata } from '@/lib/seo-metadata';
import React from 'react';
import nextDynamic from 'next/dynamic';
import { setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { createWebsiteData } from '@/lib/structured-data';
import { WorkbenchReturn } from '@/components/landing/WorkbenchReturn';
import { ExploreActivities } from '@/components/landing/ExploreActivities';


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
      <JsonLd data={createWebsiteData()} />
      <React.Suspense fallback={null}>
        <HomeToolDeepLink />
      </React.Suspense>
      <HeroSection />
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}><WorkbenchReturn /><ExploreActivities /></div>
      <ProjectsGrid />
      <ToolShowcase />
      <HomeQuickAccess />
    </main>
  );
}

export const generateMetadata = translatedMetadata('', 'Hero', 'subtitle');
