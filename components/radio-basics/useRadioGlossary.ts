'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { filterGlossary, glossaryEntries, type GlossaryCategory, type GlossaryEntry } from '@/lib/radio/glossary';

export const GLOSSARY_PAGE_SIZE = 8;

export function useRadioGlossary() {
  const t = useTranslations('RadioGlossary');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const entries: GlossaryEntry[] = glossaryEntries.map((entry) => ({
    ...entry, term: t(`entries.${entry.id}.term`), name: t(`entries.${entry.id}.name`),
    meaning: t(`entries.${entry.id}.meaning`), example: t(`entries.${entry.id}.example`),
  }));
  const filtered = filterGlossary(entries, query, category);
  const search = (next: string) => { setQuery(next); setPage(1); };
  const selectCategory = (next: GlossaryCategory | 'all') => { setCategory(next); setPage(1); };
  const clear = () => { search(''); selectCategory('all'); };
  const consult = (term: string) => { selectCategory('all'); search(term); };
  return {
    query, category, page, entries, filtered,
    visible: filtered.slice((page - 1) * GLOSSARY_PAGE_SIZE, page * GLOSSARY_PAGE_SIZE),
    search, selectCategory, setPage, clear, consult,
  };
}
