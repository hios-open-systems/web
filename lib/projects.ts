import fs from 'fs';
import path from 'path';

export interface ProjectMeta {
    slug: string;
    name: string;
    description: string;
    status: 'prototype' | 'concept' | 'wip';
    images: string[];
    readme: string;
    files: {
        name: string;
        path: string;
        type: 'pdf' | 'md' | 'code' | 'other';
    }[];
}

const projectsDir = path.join(process.cwd(), 'projects');

export function getProjectSlugs(): string[] {
    if (!fs.existsSync(projectsDir)) return [];
    return fs.readdirSync(projectsDir).filter((name) => {
        const stat = fs.statSync(path.join(projectsDir, name));
        return stat.isDirectory();
    });
}

export function getProjectBySlug(slug: string): ProjectMeta | null {
    const projectPath = path.join(projectsDir, slug);

    if (!fs.existsSync(projectPath)) return null;

    // Read README
    const readmePath = path.join(projectPath, 'README.md');
    const readme = fs.existsSync(readmePath)
        ? fs.readFileSync(readmePath, 'utf-8')
        : '';

    // Get images from pics folder
    const picsPath = path.join(projectPath, 'pics');
    const images: string[] = [];
    if (fs.existsSync(picsPath)) {
        const pics = fs.readdirSync(picsPath).filter(f =>
            /\.(jpg|jpeg|png|webp)$/i.test(f)
        );
        pics.forEach(pic => {
            images.push(`/images/${slug}/${pic}`);
        });
    }

    // Get downloadable files
    const files: ProjectMeta['files'] = [];
    const dirContents = fs.readdirSync(projectPath);

    dirContents.forEach(file => {
        const filePath = path.join(projectPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
            let type: 'pdf' | 'md' | 'code' | 'other' = 'other';
            if (file.endsWith('.pdf')) type = 'pdf';
            else if (file.endsWith('.md')) type = 'md';
            else if (file.endsWith('.ino') || file.endsWith('.cpp') || file.endsWith('.h')) type = 'code';

            if (type === 'pdf' || (type === 'md' && file !== 'README.md')) {
                files.push({
                    name: file,
                    path: `/downloads/${slug}/${file}`,
                    type,
                });
            }
        }
    });

    // Extract name and description from README first line
    const lines = readme.split('\n');
    const titleLine = lines.find(l => l.startsWith('# '));
    const name = titleLine ? titleLine.replace('# ', '').trim() : slug.toUpperCase();

    const descLine = lines.find(l => l.trim() && !l.startsWith('#'));
    const description = descLine?.trim() || '';

    return {
        slug,
        name,
        description,
        status: 'prototype', // Could be extracted from frontmatter later
        images,
        readme,
        files,
    };
}

export function getAllProjects(): ProjectMeta[] {
    const slugs = getProjectSlugs();
    return slugs
        .map(slug => getProjectBySlug(slug))
        .filter((p): p is ProjectMeta => p !== null);
}
