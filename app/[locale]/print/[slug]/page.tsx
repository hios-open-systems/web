import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { getProjectSlugs } from '@/lib/projects';
import PrintView from './PrintView';

interface Props {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
    searchParams: Promise<{
        doc?: string;
    }>;
}

export async function generateStaticParams() {
    const slugs = getProjectSlugs();
    return slugs.map((slug) => ({ slug }));
}

export default async function PrintPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { doc = 'PINOUT' } = await searchParams;

    const projectPath = path.join(process.cwd(), 'projects', slug);

    if (!fs.existsSync(projectPath)) {
        notFound();
    }

    // Read the requested document
    const docFile = `${doc}.md`;
    const docPath = path.join(projectPath, docFile);

    let content = '';
    let title = doc;

    if (fs.existsSync(docPath)) {
        content = fs.readFileSync(docPath, 'utf-8');
        // Extract title from first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            title = titleMatch[1];
        }
    } else {
        notFound();
    }

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
    const availableDocs = fs.readdirSync(projectPath)
        .filter(f => f.endsWith('.md') && f !== 'README.md')
        .map(f => f.replace('.md', ''));

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
