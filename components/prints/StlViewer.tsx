'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { mountStlScene, type SceneHandle, type StlDims } from '@/lib/stl/viewerScene';

/**
 * Visor 3D de un STL. Componente FINO: la escena Three.js vive en viewerScene.ts.
 * Se importa siempre con `dynamic(ssr:false)` (ver StlViewerLazy) para que three no
 * toque el bundle del server ni el inicial del cliente.
 */
export function StlViewer({ url, name }: { url: string; name: string }) {
  const { mode } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dims, setDims] = useState<StlDims | null>(null);
  const [spin, setSpin] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    const theme = mode === 'dark'
      ? { bg: 0x0d0d0d, model: 0xf59e0b, grid: 0x333333 }
      : { bg: 0xf5f5f5, model: 0xf59e0b, grid: 0xcccccc };

    setState('loading');
    mountStlScene(host, url, theme)
      .then(({ handle, dims }) => {
        if (cancelled) {
          handle.dispose();
          return;
        }
        handleRef.current = handle;
        handle.setAutoRotate(true);
        setDims(dims);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    const ro = new ResizeObserver(() => handleRef.current?.resize());
    ro.observe(host);

    return () => {
      cancelled = true;
      ro.disconnect();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [url, mode]);

  const toggleSpin = () => {
    const next = !spin;
    setSpin(next);
    handleRef.current?.setAutoRotate(next);
  };

  const fmt = (n: number) => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10);
  const dark = mode === 'dark';
  const chipBg = dark ? 'rgba(20,20,20,0.82)' : 'rgba(255,255,255,0.86)';
  const chipBorder = dark ? '1px solid #2a2a2a' : '1px solid #e5e5e5';
  const ink = dark ? '#e6e6e6' : '#1a1a1a';
  const dim = dark ? '#888' : '#777';

  const btn: React.CSSProperties = {
    background: chipBg, border: chipBorder, color: ink, borderRadius: 8,
    padding: '5px 10px', fontSize: 12, cursor: 'pointer', backdropFilter: 'blur(4px)',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 320 }}>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden' }} />

      {state === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: dim, fontSize: 14 }}>
          Cargando modelo…
        </div>
      )}
      {state === 'error' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#ef4444', fontSize: 14, textAlign: 'center', padding: 24 }}>
          No se pudo cargar el modelo.<br />
          <a href={url} download style={{ color: '#f59e0b', marginTop: 8 }}>Descargar el STL directo</a>
        </div>
      )}

      {state === 'ready' && (
        <>
          {/* controles */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
            <button type="button" style={btn} onClick={() => handleRef.current?.resetView()}>Reencuadrar</button>
            <button type="button" style={btn} onClick={toggleSpin}>{spin ? 'Pausar giro' : 'Girar'}</button>
          </div>
          {/* metadata */}
          {dims && (
            <div style={{
              position: 'absolute', left: 10, bottom: 10, background: chipBg, border: chipBorder,
              borderRadius: 8, padding: '6px 10px', fontSize: 11, color: dim, lineHeight: 1.5,
              backdropFilter: 'blur(4px)', fontFamily: 'ui-monospace, Menlo, monospace',
            }}>
              <div style={{ color: ink, fontWeight: 600, marginBottom: 2, fontFamily: 'inherit' }}>{name}</div>
              {fmt(dims.x)} × {fmt(dims.y)} × {fmt(dims.z)} mm · {dims.triangles.toLocaleString('es')} tris
            </div>
          )}
          <div style={{ position: 'absolute', right: 10, bottom: 10, fontSize: 10, color: dim }}>
            arrastrá para orbitar · rueda = zoom
          </div>
        </>
      )}
    </div>
  );
}

export default StlViewer;
