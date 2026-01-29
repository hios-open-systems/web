import { getProjectBySlug, getProjectSlugs } from '@/lib/projects';
import { ProjectDetailClient } from './ProjectDetailClient';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
    const slugs = getProjectSlugs();
    const locales = ['en', 'es', 'de', 'it'];

    return locales.flatMap((locale) =>
        slugs.map((slug) => ({ slug, locale }))
    );
}

export default async function ProjectPage({ params }: PageProps) {
    const { slug } = await params;
    const project = getProjectBySlug(slug);

    if (!project) {
        notFound();
    }

    return <ProjectDetailClient project={project} slug={slug} />;
}
