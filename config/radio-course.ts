export const radioLessons = [
  { id: 'voltage' },
  { id: 'current' },
  { id: 'resistance' },
  { id: 'ohm' },
  { id: 'series' },
  { id: 'parallel' },
  { id: 'power' },
  { id: 'measurement' },
  { id: 'practice' },
] as const;

export const radioResources = [
  { id: 'bands' },
  { id: 'laboratory' },
  { id: 'glossary' },
  { id: 'sources' },
] as const;

export const radioPages = [...radioLessons, ...radioResources] as const;
export type RadioPageId = typeof radioPages[number]['id'];

export function isRadioPageId(value: string): value is RadioPageId {
  return radioPages.some((page) => page.id === value);
}

export const radioCoursePath = '/radio';

export function radioPagePath(page: RadioPageId) {
  return `/radio/lecciones/${page}` as const;
}
