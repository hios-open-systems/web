import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { ProjectsIndex } from '@/components/projects/ProjectsIndex';

export const runtime = 'edge';

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <ProjectsIndex />;
}
