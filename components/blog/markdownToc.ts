// Helpers para la mini-TOC del post: extraen los h2 del markdown crudo
// (ignorando fences de código) y generan anchors estables.
import React from 'react';

export interface TocEntry {
    id: string;
    text: string;
}

export function slugifyHeading(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

export function extractH2Toc(markdown: string): TocEntry[] {
    const entries: TocEntry[] = [];
    let inFence = false;
    for (const line of markdown.split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;
        const match = /^##\s+(.+?)\s*$/.exec(line);
        if (match) {
            const text = match[1].replace(/[*_`]/g, '').trim();
            entries.push({ id: slugifyHeading(text), text });
        }
    }
    return entries;
}

/** Texto plano de un ReactNode (para generar el id del h2 renderizado). */
export function nodeToText(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(nodeToText).join('');
    if (React.isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode };
        return nodeToText(props.children);
    }
    return '';
}