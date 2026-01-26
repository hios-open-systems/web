'use client';

import React from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProjectsGrid } from '@/components/landing/ProjectsGrid';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProjectsGrid />
    </main>
  );
}
