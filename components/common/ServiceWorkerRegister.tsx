'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker in production only. Renders nothing.
 * Dev is skipped on purpose so SW caching never gets in the way of HMR.
 *
 * La versión de deploy viaja en la URL del script (/sw.js?v=…): cambia el
 * scriptURL en cada deploy, así el browser instala un SW nuevo y su activate
 * borra el cache del deploy anterior. Sin esto, un HTML/RSC cacheado de un
 * build viejo pide chunks que ya no existen y la página se ve sin estilos.
 */
export function ServiceWorkerRegister({ version }: { version: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const url = `/sw.js?v=${encodeURIComponent(version)}`;
    const register = () => {
      navigator.serviceWorker.register(url).catch(() => {
        /* registration failed — app still works online */
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, [version]);

  return null;
}
