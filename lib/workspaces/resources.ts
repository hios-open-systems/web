import { workbenchTools } from '@/config/workbench';
import posts from '@/lib/blogManifest.json';
import { projects } from '@/config/projects';
export const resources = [
  ...posts.map(post => ({ id: `article:${post.slug}`, href: `/blog/${post.slug}`, label: post.title })),
  ...workbenchTools.map(tool => ({ id: `tool:${tool.id}`, href: tool.href, label: tool.id })),
  ...projects.map(project => ({ id: `project:${project.slug}`, href: `/projects/${project.slug}`, label: project.name })),
  ...['pad', 'btdac', 'speaker'].flatMap(slug => [
    { id: `pinout:${slug}`, href: `/pinouts/${slug}`, label: `${slug.toUpperCase()} · Pinout` },
  ]),
  { id: 'page:blog', href: '/blog', label: 'Devlog' },
  { id: 'page:prints', href: '/prints', label: 'Maker' },
  { id: 'page:calculators', href: '/calculators', label: 'RCL' },
  { id: 'page:software-pad', href: '/projects/pad/software', label: 'HIOS PAD · Software' },
  { id: 'page:software-btdac', href: '/projects/btdac/software', label: 'HIOS BTDAC · Software' },
];
export const templates: Record<string, string[]> = {
  development: ['tool:payload', 'tool:object-to-types', 'tool:object-compare', 'tool:json-schema'],
  maker: ['project:pad', 'pinout:pad', 'tool:ohms-law', 'tool:serial-monitor', 'page:calculators'],
  audio: ['tool:guitar-tuner', 'tool:metronome', 'tool:tone-generator', 'tool:audio-convert', 'tool:chiptune'],
  ai: ['tool:llm-vram-calc', 'tool:token-inspector', 'tool:llm-grammar-generator', 'tool:esp32-llm-bridge'],
};
