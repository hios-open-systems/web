'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { activities } from '@/lib/workbench/discovery';
import { SaveToSpace } from '@/components/workbench/SaveToSpace';
import styles from '@/components/workbench/workspace.module.css';

const journeys = {
  development: [['tool:payload', '/workbench/payload', 'Payload Lab'], ['tool:object-to-types', '/workbench/object-to-types', 'TypeScript'], ['tool:json-schema', '/workbench/json-schema', 'JSON Schema']],
  maker: [['project:pad', '/projects/pad', 'HIOS PAD'], ['pinout:pad', '/pinouts/pad', 'Pinout'], ['tool:ohms-law', '/workbench/ohms-law', 'Ohm']],
  audio: [['tool:guitar-tuner', '/workbench/guitar-tuner', 'Tuner'], ['tool:metronome', '/workbench/metronome', 'BPM'], ['tool:chiptune', '/workbench/chiptune', 'Chiptune']],
  ai: [['tool:llm-vram-calc', '/workbench/llm-vram-calc', 'VRAM'], ['tool:token-inspector', '/workbench/token-inspector', 'Tokens'], ['tool:esp32-llm-bridge', '/workbench/esp32-llm-bridge', 'ESP32']],
  knowledge: [['page:blog', '/blog', 'Devlog'], ['tool:notes', '/workbench/notes', 'Markdown'], ['page:prints', '/prints', 'Maker']],
  software: [['page:software-pad', '/projects/pad/software', 'HIOS PAD'], ['page:software-btdac', '/projects/btdac/software', 'HIOS BTDAC']],
};
export function ExploreActivities({ heading = true }: { heading?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  return <section className={styles.stack}>
    {heading ? <h2>{t('explore')}</h2> : null}<div className={styles.grid}>{activities.map(activity => <article className={styles.card} key={activity}>
      <h3>{t(`activities.${activity}`)}</h3>
      {journeys[activity].map(([id, href, label]) => <div className={styles.entry} key={id}>
        <Link href={`/${locale}${href}`}>{id.startsWith('tool:') ? packs(`${id.slice(5)}.title`) : label}</Link><SaveToSpace resourceId={id} />
      </div>)}
    </article>)}</div><Link href={`/${locale}/tools`}>{t('external')} →</Link>
  </section>;
}
