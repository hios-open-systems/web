'use client';

import { useEffect, type RefObject } from 'react';

/** Intercept before the editor's mixed-content paste handler downloads URLs. */
export function useLocalEditorFiles(host: RefObject<HTMLDivElement | null>, onBlocked: () => void) {
  useEffect(() => {
    const guard = (event: ClipboardEvent | DragEvent) => {
      const element = host.current;
      if (!element || (!element.contains(event.target as Node) &&
        !element.contains(document.activeElement) && !element.matches(':hover'))) return;
      const data = 'clipboardData' in event ? event.clipboardData : event.dataTransfer;
      if (!data || data.files.length) return;
      const text = `${data.getData('text/html')}\n${data.getData('text/plain')}\n${data.getData('text/uri-list')}`;
      const resource = /(?:src|href|dataURL)\s*[=:]\s*["']?\s*(?:https?:|\/\/)|https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg|avif)(?:[?#\s"']|$)/i;
      if (!resource.test(text)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onBlocked();
    };
    document.addEventListener('paste', guard, true);
    document.addEventListener('drop', guard, true);
    return () => {
      document.removeEventListener('paste', guard, true);
      document.removeEventListener('drop', guard, true);
    };
  }, [host, onBlocked]);
}
