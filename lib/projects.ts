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
    technicalAssets: {
        name: string;
        path: string | null;
        ext: string;
        kind: '3d' | 'cad' | 'pcb' | 'doc' | 'firmware' | 'data' | 'other';
        source: 'project' | 'download';
    }[];
    /** Docs .md del proyecto (sin extensión, sin README) — los que renderiza /print/[slug]/[doc] */
    docs: string[];
}

const projectsDir = path.join(process.cwd(), 'projects');
const publicDir = path.join(process.cwd(), 'public');

function walkFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(fullPath));
            continue;
        }
        files.push(fullPath);
    }

    return files;
}

function classifyAsset(ext: string): ProjectMeta['technicalAssets'][number]['kind'] {
    const normalized = ext.toLowerCase();

    if (['stl', 'obj', 'step', 'stp', '3mf', 'gltf', 'glb'].includes(normalized)) return '3d';
    if (['fcstd', 'iges', 'igs', 'dwg', 'dxf'].includes(normalized)) return 'cad';
    if (['kicad_pcb', 'kicad_sch', 'kicad_pro', 'sch', 'brd'].includes(normalized)) return 'pcb';
    if (['md', 'pdf', 'txt', 'doc', 'docx'].includes(normalized)) return 'doc';
    if (['ino', 'c', 'cpp', 'h', 'hpp', 'py', 'json', 'yaml', 'yml', 'ini'].includes(normalized)) return 'firmware';
    if (['csv', 'log'].includes(normalized)) return 'data';
    return 'other';
}

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

    // Get images from pics folder (including subfolders build/ and modules/)
    const picsPath = path.join(projectPath, 'pics');
    const images: string[] = [];
    if (fs.existsSync(picsPath)) {
        // Check for build subfolder first (assembled project photos)
        const buildPath = path.join(picsPath, 'build');
        if (fs.existsSync(buildPath)) {
            const buildPics = fs.readdirSync(buildPath).filter(f =>
                /\.(jpg|jpeg|png|webp)$/i.test(f)
            );
            buildPics.forEach(pic => {
                images.push(`/images/${slug}/build/${pic}`);
            });
        }
        // Then check modules subfolder (component photos)
        const modulesPath = path.join(picsPath, 'modules');
        if (fs.existsSync(modulesPath)) {
            const modulePics = fs.readdirSync(modulesPath).filter(f =>
                /\.(jpg|jpeg|png|webp)$/i.test(f)
            );
            modulePics.forEach(pic => {
                images.push(`/images/${slug}/modules/${pic}`);
            });
        }
        // Also check root pics folder for backwards compatibility
        const rootPics = fs.readdirSync(picsPath).filter(f =>
            /\.(jpg|jpeg|png|webp)$/i.test(f)
        );
        rootPics.forEach(pic => {
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

    // Technical assets for embedded workflows (recursive)
    const technicalAssetsMap = new Map<string, ProjectMeta['technicalAssets'][number]>();
    const projectFiles = walkFiles(projectPath);
    const downloadPath = path.join(publicDir, 'downloads', slug);
    const downloadFiles = walkFiles(downloadPath);

    const pushAsset = (absolutePath: string, source: 'project' | 'download') => {
        const ext = path.extname(absolutePath).replace('.', '').toLowerCase();
        if (!ext) return;

        const relativeName = source === 'project'
            ? path.relative(projectPath, absolutePath)
            : path.relative(downloadPath, absolutePath);

        const publicPath = source === 'project'
            ? null
            : `/downloads/${slug}/${relativeName.replace(/\\/g, '/')}`;

        const asset = {
            name: relativeName.replace(/\\/g, '/'),
            path: publicPath,
            ext,
            kind: classifyAsset(ext),
            source,
        } as const;

        const key = `${asset.source}:${asset.name}`;
        technicalAssetsMap.set(key, asset);
    };

    projectFiles.forEach(file => pushAsset(file, 'project'));
    downloadFiles.forEach(file => pushAsset(file, 'download'));

    const technicalAssets = Array.from(technicalAssetsMap.values())
        .filter(asset => asset.kind !== 'other')
        .sort((a, b) => a.name.localeCompare(b.name));

    // Extract name and description from README first line
    const lines = readme.split('\n');
    const titleLine = lines.find(l => l.startsWith('# '));
    const name = titleLine ? titleLine.replace('# ', '').trim() : slug.toUpperCase();

    const descLine = lines.find(l => l.trim() && !l.startsWith('#'));
    const description = descLine?.trim() || '';

    const docs = fs
        .readdirSync(projectPath)
        .filter((file) => file.endsWith('.md') && file !== 'README.md')
        .map((file) => file.replace(/\.md$/, ''));

    return {
        slug,
        name,
        description,
        status: 'prototype', // Could be extracted from frontmatter later
        images,
        readme,
        files,
        technicalAssets,
        docs,
    };
}

export function getAllProjects(): ProjectMeta[] {
    const slugs = getProjectSlugs();
    return slugs
        .map(slug => getProjectBySlug(slug))
        .filter((p): p is ProjectMeta => p !== null);
}
