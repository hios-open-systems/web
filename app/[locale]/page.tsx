import React from 'react';
import dynamic from 'next/dynamic';

import { setRequestLocale } from 'next-intl/server';

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const HeroSection = dynamic(
  () => import('@/components/landing/HeroSection').then(mod => ({ default: mod.HeroSection })),
  { ssr: true }
);

const ProjectsGrid = dynamic(
  () => import('@/components/landing/ProjectsGrid').then(mod => ({ default: mod.ProjectsGrid })),
  { ssr: true }
);

const DocumentationSection = dynamic(
  () => import('@/components/landing/DocumentationSection').then(mod => ({ default: mod.DocumentationSection })),
  { ssr: true }
);

const ToolsSection = dynamic(
  () => import('@/components/landing/ToolsSection').then(mod => ({ default: mod.ToolsSection })),
  { ssr: true }
);

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <main>
      <HeroSection />
      <ProjectsGrid />
      <DocumentationSection />
      <ToolsSection />
    </main>
  );
}
