'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { brandIconDataUri } from '@/lib/brandIcon';

const LINK_ID = 'hios-favicon';

/**
 * Favicon de la pestaña siguiendo el accent elegido. Solo aplica acá: el ícono de
 * la pantalla de inicio lo copia el SO una vez al instalar y no vuelve a leerlo,
 * así que ese queda en el accent por defecto.
 */
export function DynamicFavicon() {
  const { accent } = useTheme();

  useEffect(() => {
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }

    link.href = brandIconDataUri(accent);
  }, [accent]);

  return null;
}
