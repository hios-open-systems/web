'use client';

import dynamic from 'next/dynamic';

/**
 * El visor, cargado en diferido. `ssr:false` = three JAMÁS se ejecuta en el
 * server/edge (lo rompería: Error 1102 del worker de Cloudflare) y tampoco entra al
 * bundle inicial: Next lo parte en un chunk propio que baja recién cuando este
 * componente se monta (o sea, cuando abrís el modal del visor).
 */
export const StlViewerLazy = dynamic(
  () => import('./StlViewer').then((m) => m.StlViewer),
  {
    ssr: false,
    loading: () => (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#888', fontSize: 14 }}>
        Iniciando visor 3D…
      </div>
    ),
  },
);
