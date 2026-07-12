'use client';

import type { ReactNode } from 'react';
import { Tabs } from 'antd';
import { useTranslations } from 'next-intl';
import type { WiringGuide } from '@/config/pinouts/wiring';
import { WiringGuideProvider } from './WiringGuideContext';
import { WiringGuideHeader } from './WiringGuideHeader';
import { PinListView } from './views/PinListView';
import { KeymapView } from './views/KeymapView';
import { WiringView } from './views/WiringView';
import { AmpView } from './views/AmpView';
import { GroupsView } from './views/GroupsView';
import { ChecklistView } from './views/ChecklistView';
import styles from './wiring-guide.module.css';

export function WiringGuideView({ guide }: { guide: WiringGuide }) {
  const t = useTranslations('WiringGuide');

  const items: { key: string; label: string; children: ReactNode }[] = [
    { key: 'pines', label: t('tabs.pines'), children: <PinListView /> },
  ];
  if (guide.keymap) {
    items.push({
      key: 'botones',
      label: t('tabs.botones'),
      children: (
        <>
          <KeymapView />
          <WiringView />
        </>
      ),
    });
  }
  if (guide.ampSdSteps) {
    items.push({ key: 'parlantes', label: t('tabs.parlantes'), children: <AmpView /> });
  }
  if (guide.sections.length > 0) {
    items.push({ key: 'conexiones', label: t('tabs.conexiones'), children: <GroupsView /> });
  }
  items.push({ key: 'check', label: t('tabs.check'), children: <ChecklistView /> });

  return (
    <WiringGuideProvider guide={guide}>
      <main className={styles.guide}>
        <WiringGuideHeader />
        <div className={styles.tabs}>
          <Tabs items={items} />
        </div>
      </main>
    </WiringGuideProvider>
  );
}
