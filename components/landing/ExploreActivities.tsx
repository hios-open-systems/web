'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { activities, type Activity } from '@/lib/workbench/discovery';
import { SaveToSpace } from '@/components/workbench/SaveToSpace';
import { ArrowRightOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { ActivityGraphic } from '@/components/ui/ActivityGraphic';
import styles from './landing.module.css';

const journeys = {
  development: [
    ['tool:payload', '/workbench/payload', 'Payload Lab'],
    ['tool:object-to-types', '/workbench/object-to-types', 'TypeScript'],
    ['tool:json-schema', '/workbench/json-schema', 'JSON Schema'],
  ],
  maker: [
    ['project:pad', '/projects/pad', 'HIOS PAD'],
    ['pinout:pad', '/pinouts/pad', 'Pinout'],
    ['tool:ohms-law', '/workbench/ohms-law', 'Ohm'],
  ],
  audio: [
    ['tool:chiptune', '/workbench/chiptune', 'Chiptune'],
    ['tool:beatmaker', '/workbench/beatmaker', 'Beatmaker'],
    ['tool:guitar-tuner', '/workbench/guitar-tuner', 'Tuner'],
  ],
  ai: [
    ['tool:llm-vram-calc', '/workbench/llm-vram-calc', 'VRAM'],
    ['tool:token-inspector', '/workbench/token-inspector', 'Tokens'],
    ['tool:esp32-llm-bridge', '/workbench/esp32-llm-bridge', 'ESP32'],
  ],
  knowledge: [
    ['page:blog', '/blog', 'Devlog'],
    ['tool:notes', '/workbench/notes', 'Markdown'],
    ['page:prints', '/prints', 'Maker'],
  ],
  software: [
    ['page:software-pad', '/projects/pad/software', 'HIOS PAD'],
    ['page:software-btdac', '/projects/btdac/software', 'HIOS BTDAC'],
  ],
};
export function ExploreActivities({ heading = true }: { heading?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('Workspace');
  const lab = useTranslations('Landing');
  return (
    <section className={styles.explore} id="explore">
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.kicker}>02 / {lab('directory')}</span>
          {heading ? <h2>{lab('exploreTitle')}</h2> : null}
        </div>
        <p>{lab('exploreSubtitle')}</p>
      </header>
      <StudioSpotlight locale={locale} />
      <div className={styles.activityGrid}>
        {activities.map((activity, index) => (
          <ActivityCard key={activity} activity={activity} index={index} />
        ))}
      </div>
      <Link className={styles.externalLink} href={`/${locale}/tools`}>
        {t('external')} <ArrowUpOutlined rotate={45} />
      </Link>
    </section>
  );
}

function StudioSpotlight({ locale }: { locale: string }) {
  const packs = useTranslations('Workbench.packs');
  const w = useTranslations('Workbench');
  return (
    <div className={styles.studioSpotlight} data-reveal>
      <Link href={`/${locale}/composer`} className={styles.studioCard} data-studio="chiptune">
        <div className={styles.studioMeta}>
          <span>SYNTH—01 / 8-BIT &amp; RETRO</span>
          <ArrowUpOutlined rotate={45} />
        </div>
        <h3>{packs('chiptune.title')}</h3>
        <p>{packs('chiptune.description')}</p>
        <div className={styles.studioTags}>
          <span>PIANO ROLL</span>
          <span>PROCEDURAL</span>
          <span>MIDI / WAV / MP3</span>
          <strong className={styles.studioCta}>{w('toolCta')} →</strong>
        </div>
      </Link>
      <Link href={`/${locale}/workbench/beatmaker`} className={styles.studioCard} data-studio="beatmaker">
        <div className={styles.studioMeta}>
          <span>DRUM—08 / URBAN LOOPER DAW</span>
          <ArrowUpOutlined rotate={45} />
        </div>
        <h3>{packs('beatmaker.title')}</h3>
        <p>{packs('beatmaker.description')}</p>
        <div className={styles.studioTags}>
          <span>808 SUB-BASS</span>
          <span>TRAP / BOOMBAP</span>
          <span>16-STEP PADS</span>
          <strong className={styles.studioCta}>{w('toolCta')} →</strong>
        </div>
      </Link>
    </div>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const locale = useLocale();
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const lab = useTranslations('Landing');
  return (
    <article className={styles.activityCard} data-activity={activity} data-reveal>
      <div className={styles.cardTop}>
        <span>
          0{index + 1} / {activity.toUpperCase()}
        </span>
        <ArrowUpOutlined rotate={45} />
      </div>
      <ActivityGraphic className={styles.graphic} activity={activity} />
      <h3>{t(`activities.${activity}`)}</h3>
      <p className={styles.cardDescription}>{lab(`activities.${activity}`)}</p>
      {journeys[activity].map(([id, href, label]) => (
        <div className={styles.entry} key={id}>
          <Link href={`/${locale}${href}`}>
            {id.startsWith('tool:') ? packs(`${id.slice(5)}.title`) : label}
            <ArrowRightOutlined />
          </Link>
          <SaveToSpace resourceId={id} compact />
        </div>
      ))}
    </article>
  );
}
