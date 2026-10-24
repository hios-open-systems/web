'use client';
import { useEffect, useRef } from 'react';
import { readHandoff } from '@/lib/workbench/handoff';
import { trackWorkbench } from '@/lib/workbench/events';
import { useToolDraft } from './useToolDraft';

export function useToolBridge(toolId: string, receive: (values: Record<string, string>) => void, draft?: Record<string, string>) {
  useToolDraft(toolId, draft, receive);
  const callback = useRef(receive);
  callback.current = receive;
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('handoff');
    if (!id) return;
    const values = readHandoff(id, toolId);
    if (values) { callback.current(values); trackWorkbench('handoff_complete', toolId); }
    else window.dispatchEvent(new CustomEvent('hios:handoff-error'));
    // Keep the opaque identifier so reloads work during the session.
  }, [toolId]);
}
