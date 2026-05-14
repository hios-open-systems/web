export type WorkbenchPackId = 'payload' | 'snippets' | 'embedded';

export interface WorkbenchPack {
    id: WorkbenchPackId;
    href: string;
    accent: string;
    icon: 'data' | 'notes' | 'circuits';
}

export const workbenchPacks: WorkbenchPack[] = [
    {
        id: 'payload',
        href: '/workbench/payload',
        accent: '#0ea5e9',
        icon: 'data',
    },
    {
        id: 'snippets',
        href: '/workbench/snippets',
        accent: '#f59e0b',
        icon: 'notes',
    },
    {
        id: 'embedded',
        href: '/calculators',
        accent: '#22c55e',
        icon: 'circuits',
    },
];

export const workbenchSignals = [
    { key: 'localFirst', accent: '#0ea5e9' },
    { key: 'shareable', accent: '#f59e0b' },
    { key: 'dailyUse', accent: '#22c55e' },
];