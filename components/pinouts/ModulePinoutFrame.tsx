'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Module } from '@/config/modules';
import { useTheme } from '@/lib/ThemeContext';
import styles from './pinouts.module.css';

interface ModulePinoutFrameProps {
  module: Module;
}

export function ModulePinoutFrame({ module }: ModulePinoutFrameProps) {
  const { mode } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const postTheme = useCallback((nextMode: 'light' | 'dark') => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'hios-pinout-theme', mode: nextMode },
      window.location.origin,
    );
  }, []);

  // The hash carries the current mode only when the module (and thus the iframe
  // document) changes, so first paint is themed with no flash. A mode-only
  // toggle keeps the same src — it is pushed via postMessage instead, so the
  // frame never reloads when the user flips the theme.
  const src = useMemo(() => `${module.htmlPath}#theme=${modeRef.current}`, [module.htmlPath]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    postTheme(modeRef.current);
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;

    let rafId = 0;
    let lastHeight = 0;
    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const next = Math.ceil(Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight));
        if (next > 0 && next !== lastHeight) {
          lastHeight = next;
          setHeight(next);
        }
      });
    };

    measure();
    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(doc.body);
  }, [postTheme]);

  useEffect(() => {
    setLoaded(false);
    setHeight(null);
  }, [module.id]);

  // Push live theme toggles to the already-loaded frame (no reload).
  useEffect(() => {
    if (loaded) postTheme(mode);
  }, [mode, loaded, postTheme]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <div className={styles.iframeWrapper} style={height ? { height } : undefined}>
      <iframe
        ref={iframeRef}
        src={src}
        title={`${module.name} Pinout`}
        className={`${styles.iframe} ${loaded ? styles.iframeLoaded : ''}`}
        style={height ? { height } : undefined}
        onLoad={handleLoad}
      />
    </div>
  );
}
