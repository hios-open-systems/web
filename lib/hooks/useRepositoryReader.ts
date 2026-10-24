'use client';
import { useEffect, useRef, useState } from 'react';
import { parseRepository, readRepository, type Repository, type RepoEntry } from '@/lib/repositories/reader';

export function useRepositoryReader() {
  const connection = useRef<{ repo: Repository; token: string } | null>(null);
  const request = useRef<AbortController | null>(null);
  const drafts = useRef(new Map<string, string>());
  const [connected, setConnected] = useState(false);
  const [entries, setEntries] = useState<RepoEntry[]>([]);
  const [path, setPath] = useState('');
  const [file, setFile] = useState('');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [limited, setLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => () => { request.current?.abort(); connection.current = null; }, []);

  async function load(nextPath: string, directory: boolean, nextPage = 1) {
    if (!connection.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError(false);
    try {
      const { repo, token } = connection.current;
      const data = await readRepository(repo, token, nextPath, directory, controller.signal, nextPage);
      if (controller.signal.aborted) return;
      setConnected(true);
      if (data.entries) { setEntries(data.entries); setPath(nextPath); setPage(nextPage); setMore(!!data.more); setLimited(!!data.limited); }
      else { setFile(nextPath); setText(drafts.current.get(nextPath) ?? data.text ?? ''); }
    } catch { if (!controller.signal.aborted) setError(true); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function connect(url: string, branch: string, token: string) {
    try {
      connection.current = { repo: parseRepository(url, branch), token: token.trim() };
      void load('', true);
    } catch { setError(true); }
  }
  function disconnect() {
    request.current?.abort(); connection.current = null;
    drafts.current.clear();
    setConnected(false); setEntries([]); setFile(''); setText(''); setPath(''); setError(false); setBusy(false);
  }
  const edit = (value: string) => { drafts.current.set(file, value); setText(value); };
  return { connected, entries, path, file, text, setText: edit, busy, error, page, more, limited, load, connect, disconnect };
}
