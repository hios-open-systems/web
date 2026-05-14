export type WorkbenchSectionId = 'validation' | 'generation' | 'testing';

export type WorkbenchToolId =
  | 'payload'
  | 'type-checker'
  | 'jwt-decode'
  | 'dns-lookup'
  | 'certificate-check'
  | 'object-to-types'
  | 'random-string'
  | 'object-compare'
  | 'site-checker'
  | 'snippets'
  | 'embedded';

export type WorkbenchIcon = 'data' | 'notes' | 'circuits' | 'shield' | 'spark' | 'compare' | 'network';

export interface WorkbenchSection {
  id: WorkbenchSectionId;
    href: string;
    accent: string;
  icon: WorkbenchIcon;
}

export interface WorkbenchTool {
  id: WorkbenchToolId;
  sectionId: WorkbenchSectionId;
  href: string;
  accent: string;
  icon: WorkbenchIcon;
  featured?: boolean;
  external?: boolean;
}

export interface WorkbenchPack extends WorkbenchTool { }
export type WorkbenchPackId = WorkbenchToolId;

export const workbenchSections: WorkbenchSection[] = [
  {
    id: 'validation',
    href: '/workbench/sections/validation',
    accent: '#0ea5e9',
    icon: 'shield',
  },
  {
    id: 'generation',
    href: '/workbench/sections/generation',
    accent: '#f59e0b',
    icon: 'spark',
  },
  {
    id: 'testing',
    href: '/workbench/sections/testing',
    accent: '#22c55e',
    icon: 'compare',
  },
];

export const workbenchTools: WorkbenchTool[] = [
  {
    id: 'payload',
    sectionId: 'validation',
    href: '/workbench/payload',
    accent: '#0ea5e9',
    icon: 'data',
    featured: true,
  },
  {
    id: 'type-checker',
    sectionId: 'validation',
    href: '/workbench/type-checker',
    accent: '#14b8a6',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'jwt-decode',
    sectionId: 'validation',
    href: '/workbench/jwt-decode',
    accent: '#38bdf8',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'dns-lookup',
    sectionId: 'validation',
    href: '/workbench/dns-lookup',
    accent: '#06b6d4',
    icon: 'network',
    featured: true,
  },
  {
    id: 'certificate-check',
    sectionId: 'validation',
    href: '/workbench/certificate-check',
    accent: '#3b82f6',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'object-to-types',
    sectionId: 'generation',
    href: '/workbench/object-to-types',
    accent: '#f97316',
    icon: 'data',
    featured: true,
  },
  {
    id: 'random-string',
    sectionId: 'generation',
    href: '/workbench/random-string',
    accent: '#f59e0b',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'object-compare',
    sectionId: 'testing',
    href: '/workbench/object-compare',
    accent: '#22c55e',
    icon: 'compare',
  },
  {
    id: 'site-checker',
    sectionId: 'testing',
    href: '/workbench/site-checker',
    accent: '#10b981',
    icon: 'network',
    featured: true,
  },
  {
    id: 'snippets',
    sectionId: 'generation',
    href: '/workbench/snippets',
    accent: '#fbbf24',
    icon: 'notes',
  },
  {
    id: 'embedded',
    sectionId: 'testing',
    href: '/calculators',
    accent: '#22c55e',
    icon: 'circuits',
    external: true,
  },
];

export const workbenchPacks: WorkbenchPack[] = workbenchTools.filter((tool) => tool.featured);

export function getWorkbenchSection(sectionId: WorkbenchSectionId) {
  return workbenchSections.find((section) => section.id === sectionId);
}

export function getWorkbenchTool(toolId: WorkbenchToolId) {
  return workbenchTools.find((tool) => tool.id === toolId);
}

export function getWorkbenchToolsBySection(sectionId: WorkbenchSectionId) {
  return workbenchTools.filter((tool) => tool.sectionId === sectionId);
}

export const workbenchSignals = [
  { key: 'localFirst', accent: '#0ea5e9' },
  { key: 'shareable', accent: '#f59e0b' },
  { key: 'dailyUse', accent: '#22c55e' },
];