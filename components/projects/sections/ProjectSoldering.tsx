'use client';

import { useTranslations } from 'next-intl';
import { getWiringGuide } from '@/config/pinouts/guides';
import { localizeGuide, type GuideCopy } from '@/config/pinouts/localizeGuide';
import { WiringGuideProvider } from '@/components/wiring-guide/WiringGuideContext';
import { SolderingMode } from '@/components/wiring-guide/assembly/SolderingMode';

/** The pinout page's soldering mode, embedded where the build actually happens: the project page. */
export function ProjectSoldering({ slug }: { slug: string }) {
  const content = useTranslations('WiringGuideContent');
  const guide = getWiringGuide(slug);
  if (!guide) return null;
  const localized = localizeGuide(guide, content.raw(guide.meta.id) as GuideCopy);
  return <WiringGuideProvider guide={localized}><SolderingMode embedded /></WiringGuideProvider>;
}
