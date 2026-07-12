import type { WiringGuide } from './wiring';
import { PAD_WIRING } from './pad';
import { BTDAC_WIRING } from './btdac';
import { SPEAKER_WIRING } from './speaker';

export const WIRING_GUIDES: Record<string, WiringGuide> = {
  pad: PAD_WIRING,
  btdac: BTDAC_WIRING,
  speaker: SPEAKER_WIRING,
};

export const WIRING_GUIDE_SLUGS = Object.keys(WIRING_GUIDES);

export const getWiringGuide = (slug: string): WiringGuide | undefined => WIRING_GUIDES[slug];
