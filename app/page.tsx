import React from 'react';
import dynamic from 'next/dynamic';

// Importación dinámica de componentes client-side
const HeroSection = dynamic(
  () => import('@/components/landing/HeroSection').then(mod => ({ default: mod.HeroSection })),
  { ssr: true }
);

const ProjectsGrid = dynamic(
  () => import('@/components/landing/ProjectsGrid').then(mod => ({ default: mod.ProjectsGrid })),
  { ssr: true }
);

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProjectsGrid />
    </main>
  );
}
