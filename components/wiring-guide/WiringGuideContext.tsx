'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { WiringGuide } from '@/config/pinouts/wiring';

const WiringGuideContext = createContext<WiringGuide | null>(null);

export function WiringGuideProvider({ guide, children }: { guide: WiringGuide; children: ReactNode }) {
  return <WiringGuideContext.Provider value={guide}>{children}</WiringGuideContext.Provider>;
}

export function useWiringGuide(): WiringGuide {
  const guide = useContext(WiringGuideContext);
  if (!guide) throw new Error('useWiringGuide must be used within a WiringGuideProvider');
  return guide;
}
