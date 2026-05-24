'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Module } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModulePinoutFrameProps {
  module: Module;
}

export function ModulePinoutFrame({ module }: ModulePinoutFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
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
  }, []);

  useEffect(() => {
    setLoaded(false);
    setHeight(null);
  }, [module.id]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <div className={styles.iframeWrapper} style={height ? { height } : undefined}>
      <iframe
        ref={iframeRef}
        src={module.htmlPath}
        title={`${module.name} Pinout`}
        className={`${styles.iframe} ${loaded ? styles.iframeLoaded : ''}`}
        style={height ? { height } : undefined}
        onLoad={handleLoad}
      />
    </div>
  );
}
