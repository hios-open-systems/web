import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { getProjectSlugs } from '@/lib/projects';
import { setRequestLocale } from 'next-intl/server';
import PrintView from './PrintView';

export const dynamic = 'force-static';

interface Props {
    params: Promise<{
        locale: string;
        slug: string;
        doc: string;
    }>;
}

// Get all available docs for a project
function getProjectDocs(slug: string): string[] {
    const projectPath = path.join(process.cwd(), 'projects', slug);
    if (!fs.existsSync(projectPath)) return [];

    return fs.readdirSync(projectPath)
        .filter(f => f.endsWith('.md') && f !== 'README.md')
        .map(f => f.replace('.md', ''));
}

// Pre-generate all combinations of locale/slug/doc
export async function generateStaticParams() {
    const slugs = getProjectSlugs();
    const locales = ['en', 'es', 'de', 'it'];

    const params: { locale: string; slug: string; doc: string }[] = [];

    for (const locale of locales) {
        for (const slug of slugs) {
            const docs = getProjectDocs(slug);
            for (const doc of docs) {
                params.push({ locale, slug, doc });
            }
        }
    }

    return params;
}

export default async function PrintPage({ params }: Props) {
    const { locale, slug, doc } = await params;
    setRequestLocale(locale);

    const projectPath = path.join(process.cwd(), 'projects', slug);

    if (!fs.existsSync(projectPath)) {
        notFound();
    }

    // Read the requested document
    const docFile = `${doc}.md`;
    const docPath = path.join(projectPath, docFile);

    if (!fs.existsSync(docPath)) {
        notFound();
    }

    const content = fs.readFileSync(docPath, 'utf-8');

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : doc;

    // Read README for project name
    const readmePath = path.join(projectPath, 'README.md');
    let projectName = slug.toUpperCase();
    if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf-8');
        const nameMatch = readme.match(/^#\s+(.+)$/m);
        if (nameMatch) {
            projectName = nameMatch[1];
        }
    }

    // Get available docs for navigation
    const availableDocs = getProjectDocs(slug);

    return (
        <PrintView
            content={content}
            title={title}
            projectName={projectName}
            slug={slug}
            currentDoc={doc}
            availableDocs={availableDocs}
        />
    );
}
