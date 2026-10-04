'use client';

import { useEffect, useState } from 'react';
import { BREAKOUTS, getBreakout } from '@/config/pinouts/modules';

export function useBreakoutNavigation() {
  const [selectedId, setSelectedId] = useState(BREAKOUTS[0].id);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const restore = () => {
      const id = window.location.hash.slice(1);
      setSelectedId(getBreakout(id)?.id ?? BREAKOUTS[0].id);
    };
    restore();
    setReady(true);
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);

  const select = (id: string) => {
    if (!getBreakout(id)) return;
    setSelectedId(id);
    window.location.hash = id;
    if (window.matchMedia('(max-width: 900px)').matches) {
      document.getElementById('pinout-detail')?.scrollIntoView({ block: 'start' });
    }
  };
  return { selected: getBreakout(selectedId) ?? BREAKOUTS[0], select, ready };
}
