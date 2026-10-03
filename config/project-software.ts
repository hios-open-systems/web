export const softwareProjects = {
  pad: {
    name: 'HIOS PAD',
    sections: ['controls', 'editor', 'companion', 'setup', 'availability'],
    sources: [
      { label: 'Firmware', path: 'pad' },
      { label: 'Companion', path: 'pad/companion' },
    ],
  },
  btdac: {
    name: 'HIOS BTDAC',
    sections: ['audio', 'android', 'setup', 'availability'],
    sources: [
      { label: 'Firmware', path: 'btdac' },
      { label: 'Android', path: 'btdac/android' },
    ],
  },
} as const;

export type SoftwareProjectSlug = keyof typeof softwareProjects;
export function isSoftwareProject(slug: string): slug is SoftwareProjectSlug {
  return Object.hasOwn(softwareProjects, slug);
}

export function softwarePath(slug: SoftwareProjectSlug): `/projects/${SoftwareProjectSlug}/software` {
  return `/projects/${slug}/software`;
}
