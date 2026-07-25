'use client';

import dynamic from 'next/dynamic';

// ssr:false: el composer usa Web Audio + antd y depende de mode/skin (que en SSR
// se pinta dark+datasheet). Igual que ToolRenderer, se carga solo en el cliente
// para evitar mismatch de hidratación y sacar el bundle pesado del edge.
const ComposerApp = dynamic(() => import('./ComposerApp').then((m) => m.ComposerApp), {
  ssr: false,
});

export function ComposerClient() {
  return <ComposerApp />;
}
