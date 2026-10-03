import { getProjectBySlug, getProjectSlugs } from '@/lib/projects';

import { ProjectDetailClient } from './ProjectDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isSoftwareProject, softwarePath } from '@/config/project-software';
import { PageTrail } from '@/components/seo/PageTrail';
import { JsonLd } from '@/components/seo/JsonLd';
import { createProjectPageData } from '@/lib/structured-data';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-static';

interface PageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { locale, slug } = await params;
    if (!getProjectSlugs().includes(slug)) notFound();
    const project = getProjectBySlug(slug);
    if (!project) notFound();
    return createPageMetadata(locale, `/projects/${encodeURIComponent(slug)}`, `${project.name} | HIOS`, project.description);
}

export async function generateStaticParams() {
    const slugs = getProjectSlugs();
    const locales = ['en', 'es', 'de', 'it'];

    return locales.flatMap((locale) =>
        slugs.map((slug) => ({ slug, locale }))
    );
}

export default async function ProjectPage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);
    const project = getProjectBySlug(slug);

    if (!project) {
        notFound();
    }

    // Map images to gallery for the client component
    const projectWithGallery = {
        ...project,
        gallery: project.images,
    };

    const header = await getTranslations({ locale, namespace: 'Header' });
    const software = await getTranslations({ locale, namespace: 'ProjectSoftware' });
    const path = `/projects/${encodeURIComponent(slug)}` as const;
    return <>
        <PageTrail locale={locale} items={[
            { name: header('home'), path: '' }, { name: header('projects'), path: '/projects' },
            { name: project.name, path },
        ]} />
        <JsonLd data={createProjectPageData(locale, path, project.name, project.description)} />
        {isSoftwareProject(slug) && <aside style={{ maxWidth: 1132, margin: '16px auto', padding: '20px 24px', border: '1px solid var(--hios-border)', borderRadius: 12 }}>
            <Link href={`/${locale}${softwarePath(slug)}`} style={{ color: 'var(--accent-text)', fontSize: 20 }}>
                {software(`${slug}.title`)} →
            </Link>
            <p style={{ color: 'var(--hios-text-secondary)', marginBottom: 0 }}>{software(`${slug}.description`)}</p>
        </aside>}
        <ProjectDetailClient project={projectWithGallery} slug={slug} />
    </>;
}
