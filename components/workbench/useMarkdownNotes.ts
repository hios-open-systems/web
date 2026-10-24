'use client';
import { readRaw, writeRaw } from '@/lib/storage/safeLocalStorage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type NoteRecord, createNoteDraft, readNotes, writeNotes } from '@/lib/workbench/notes';
function normalizeEscapedNewlines(value: string): string {
  if (!value.includes('\\n') || value.includes('\n')) return value;
  return value.replace(/\\n/g, '\n');
}


export function useMarkdownNotes() {
  const t = useTranslations('Workbench.notes');
  const searchParams = useSearchParams();
  const hydrated = useRef(false);

  const [saveFailed, setSaveFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    let loaded = readNotes().map((note) => ({
      ...note,
      body: normalizeEscapedNewlines(note.body),
    }));
    const shared = searchParams.get('note');
    if (shared !== null && !loaded.some(note => note.body === normalizeEscapedNewlines(shared))) {
      const imported = createNoteDraft({
        title: t('importedTitle'),
        body: normalizeEscapedNewlines(shared),
      });
      loaded = [imported, ...loaded];
    }
    if (loaded.length === 0) {
      loaded = [
        createNoteDraft({
          title: t('exampleTitle'),
          body: normalizeEscapedNewlines(t('exampleBody')),
        }),
      ];
    }
    setNotes(loaded);
    setReady(true);
    const remembered = shared === null ? readRaw('hios:notes:active') : null;
    setActiveId(loaded.find(note => note.id === remembered)?.id ?? loaded[0]?.id ?? null);
  }, [searchParams, t]);

  // Small local documents are saved immediately, including before navigation.
  useEffect(() => {
    if (ready) setSaveFailed(!writeNotes(notes));
  }, [notes, ready]);

  useEffect(() => { if (ready && activeId) writeRaw('hios:notes:active', activeId); }, [ready, activeId]);

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  const patchActive = (patch: Partial<NoteRecord>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    );
  };

  const addNote = () => {
    const draft = createNoteDraft({ title: t('newNote') });
    setNotes((prev) => [draft, ...prev]);
    setActiveId(draft.id);
  };

  const removeNote = (id: string) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    if (id === activeId) setActiveId(next[0]?.id ?? null);
  };


  return { notes, active, activeId, setActiveId, saveFailed, patchActive, addNote, removeNote };
}
