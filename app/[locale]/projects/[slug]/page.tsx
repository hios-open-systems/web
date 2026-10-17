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
import { RelatedResources } from '@/components/workbench/RelatedResources';
import { ProjectGettingStarted } from '@/components/projects/ProjectGettingStarted';

export const dynamic = 'force-static';

interface PageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { locale, slug } = await params;
    if (!getProjectSlugs().includes(slug)) notFound();
    const project = getProjectBySlug(slug, locale);
    if (!project) notFound();
    const copy = await getTranslations({ locale, namespace: 'Projects' });
    const description = copy.has(`cards.${slug}.description`) ? copy(`cards.${slug}.description`) : project.description;
    return createPageMetadata(locale, `/projects/${encodeURIComponent(slug)}`, `${project.name} | HIOS`, description);
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
    const project = getProjectBySlug(slug, locale);

    if (!project) {
        notFound();
    }

    const copy = await getTranslations({ locale, namespace: 'Projects' });
    const description = copy.has(`cards.${slug}.description`) ? copy(`cards.${slug}.description`) : project.description;
    const projectWithGallery = {
        ...project,
        description,
        gallery: project.images,
    };

    const header = await getTranslations({ locale, namespace: 'Header' });
    const software = await getTranslations({ locale, namespace: 'ProjectSoftware' });
    const path = `/projects/${encodeURIComponent(slug)}` as const;
    const softwareBanner = isSoftwareProject(slug) ? (
        <aside
            style={{
                maxWidth: 900,
                margin: '0 auto 28px',
                padding: '18px 22px',
                border: '1px solid var(--hios-border)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 12,
                background: 'var(--hios-bg-secondary)',
            }}
        >
            <Link
                href={`/${locale}${softwarePath(slug)}`}
                style={{ color: 'var(--accent-text)', fontSize: 18, fontWeight: 600, textDecoration: 'none' }}
            >
                {software(`${slug}.title`)} →
            </Link>
            <p style={{ color: 'var(--hios-text-secondary)', margin: '6px 0 0', fontSize: 14, lineHeight: 1.55 }}>
                {software(`${slug}.description`)}
            </p>
        </aside>
    ) : undefined;

    return <>
        <PageTrail locale={locale} items={[
            { name: header('home'), path: '' }, { name: header('projects'), path: '/projects' },
            { name: project.name, path },
        ]} />
        <JsonLd data={createProjectPageData(locale, path, project.name, description)} />
        <ProjectDetailClient
            project={projectWithGallery}
            slug={slug}
            softwareBanner={softwareBanner}
            gettingStarted={isSoftwareProject(slug) ? <ProjectGettingStarted locale={locale} slug={slug} /> : undefined}
        />
        <RelatedResources resourceId={`project:${slug}`} toolIds={['serial-monitor', 'ohms-law', 'resistor-color-code']}
            pinout={['pad', 'btdac', 'speaker'].includes(slug) ? slug : undefined} />
    </>;
}
