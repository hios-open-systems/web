export type WorkbenchSectionId = 'validation' | 'generation' | 'testing';

export type WorkbenchToolId =
  | 'payload'
  | 'type-checker'
  | 'jwt-decode'
  | 'dns-lookup'
  | 'certificate-check'
  | 'hash-digest'
  | 'object-to-types'
  | 'random-string'
  | 'encoder'
  | 'uuid-ulid'
  | 'object-compare'
  | 'regex'
  | 'text-diff'
  | 'mermaid'
  | 'site-checker'
  | 'snippets'
  | 'notes'
  | 'patterns'
  | 'cron'
  | 'color'
  | 'timestamp'
  | 'number-base'
  | 'json-schema'
  | 'url-parser'
  | 'regex'
  | 'image-base64'
  | 'embedded';

export type WorkbenchIcon = 'data' | 'notes' | 'circuits' | 'shield' | 'spark' | 'compare' | 'network';

export type WorkbenchLocality = 'local' | 'network';

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
  locality: WorkbenchLocality;
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
    locality: 'local',
    sectionId: 'validation',
    href: '/workbench/payload',
    accent: '#0ea5e9',
    icon: 'data',
    featured: true,
  },
  {
    id: 'type-checker',
    locality: 'local',
    sectionId: 'validation',
    href: '/workbench/type-checker',
    accent: '#14b8a6',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'jwt-decode',
    locality: 'local',
    sectionId: 'validation',
    href: '/workbench/jwt-decode',
    accent: '#38bdf8',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'dns-lookup',
    locality: 'network',
    sectionId: 'validation',
    href: '/workbench/dns-lookup',
    accent: '#06b6d4',
    icon: 'network',
    featured: true,
  },
  {
    id: 'certificate-check',
    locality: 'network',
    sectionId: 'validation',
    href: '/workbench/certificate-check',
    accent: '#3b82f6',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'hash-digest',
    locality: 'local',
    sectionId: 'validation',
    href: '/workbench/hash-digest',
    accent: '#0ea5e9',
    icon: 'shield',
    featured: true,
  },
  {
    id: 'object-to-types',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/object-to-types',
    accent: '#f97316',
    icon: 'data',
    featured: true,
  },
  {
    id: 'random-string',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/random-string',
    accent: '#f59e0b',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'encoder',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/encoder',
    accent: '#f59e0b',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'uuid-ulid',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/uuid-ulid',
    accent: '#fbbf24',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'object-compare',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/object-compare',
    accent: '#22c55e',
    icon: 'compare',
  },
  {
    id: 'regex',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/regex',
    accent: '#22c55e',
    icon: 'compare',
    featured: true,
  },
  {
    id: 'text-diff',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/text-diff',
    accent: '#10b981',
    icon: 'compare',
    featured: true,
  },
  {
    id: 'mermaid',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/mermaid',
    accent: '#8b5cf6',
    icon: 'circuits',
    featured: true,
  },
  {
    id: 'site-checker',
    locality: 'network',
    sectionId: 'testing',
    href: '/workbench/site-checker',
    accent: '#10b981',
    icon: 'network',
    featured: true,
  },
  {
    id: 'snippets',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/snippets',
    accent: '#fbbf24',
    icon: 'notes',
  },
  {
    id: 'notes',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/notes',
    accent: '#fbbf24',
    icon: 'notes',
    featured: true,
  },
  {
    id: 'patterns',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/patterns',
    accent: '#a78bfa',
    icon: 'notes',
    featured: true,
  },
  {
    id: 'cron',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/cron',
    accent: '#06b6d4',
    icon: 'compare',
    featured: true,
  },
  {
    id: 'color',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/color',
    accent: '#ec4899',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'timestamp',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/timestamp',
    accent: '#f59e0b',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'number-base',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/number-base',
    accent: '#a78bfa',
    icon: 'data',
    featured: true,
  },
  {
    id: 'json-schema',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/json-schema',
    accent: '#f59e0b',
    icon: 'notes',
    featured: true,
  },
  {
    id: 'url-parser',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/url-parser',
    accent: '#6366f1',
    icon: 'network',
    featured: true,
  },
  {
    id: 'regex',
    locality: 'local',
    sectionId: 'testing',
    href: '/workbench/regex',
    accent: '#f97316',
    icon: 'spark',
    featured: true,
  },
  {
    id: 'image-base64',
    locality: 'local',
    sectionId: 'generation',
    href: '/workbench/image-base64',
    accent: '#ec4899',
    icon: 'data',
    featured: false,
  },
  {
    id: 'embedded',
    locality: 'local',
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
