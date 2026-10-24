'use client';
import { useCallback, useEffect, useRef } from 'react';

function openDrafts(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hios-tool-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Storage blocked'));
  });
}

export function useToolFileDraft(toolId: string, restore: (file: File) => void) {
  const callback = useRef(restore);
  callback.current = restore;
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    const ticket = revision.current;
    void openDrafts().then(db => {
      const transaction = db.transaction('files', 'readonly');
      const request = transaction.objectStore('files').get(toolId);
      request.onsuccess = () => {
        if (active && revision.current === ticket && request.result instanceof File) callback.current(request.result);
      };
      transaction.oncomplete = transaction.onabort = () => db.close();
    }).catch(() => {});
    return () => { active = false; };
  }, [toolId]);
  return useCallback((file: File | null) => {
    revision.current++;
    // Serial transactions preserve upload/clear order even while opening the DB.
    queue.current = queue.current.then(async () => {
      const db = await openDrafts();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('files', 'readwrite');
        const store = transaction.objectStore('files');
        if (file) store.put(file, toolId); else store.delete(toolId);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error); };
      });
    }).catch(() => {});
  }, [toolId]);
}
