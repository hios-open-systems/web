'use client';

import Link from 'next/link';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools, type WorkbenchTool } from '@/config/workbench';
import { getWorkbenchIcon } from '@/components/workbench/workbenchIcons';
import { ArrowRightOutlined } from '@ant-design/icons';
import styles from './toolShowcase.module.css';

const ALL_TOOLS = workbenchTools.filter((tool) => !tool.external);

// Highlight the latest AI tools and a few core ones to reflect the new platform reality
const HIGHLIGHTED_IDS = [
  'esp32-llm-bridge',
  'llm-vram-calc',
  'token-inspector',
  'llm-grammar-generator',
  'tone-generator',
  'payload',
  'resistor-color-code',
  'chiptune',
];

const TOOLS = ALL_TOOLS.filter((tool) => HIGHLIGHTED_IDS.includes(tool.id));

/**
 * Muestra una selección de herramientas en el Home (no las 44): un pantallazo,
 * con atajo al azar y link a /workbench para ver todas. Así Proyectos y los
 * accesos tienen más aire arriba. /?tool=random lo resuelve HomeToolDeepLink.
 */
export function ToolShowcase() {
  const locale = useLocale();
  const t = useTranslations('Hero');
  const lab = useTranslations('Landing');

  return (
    <section className={styles.showcase} id="tools">
      <div className={styles.showcaseHeader}>
        <div className={styles.showcaseHeadings}>
          <span className={styles.showcaseKicker} aria-hidden>
            03 / WORKBENCH
          </span>
          <h2 className={styles.showcaseTitle}>{lab('toolsTitle')}</h2>
          <p className={styles.showcaseSubtitle}>{lab('toolsSubtitle')}</p>
        </div>
        <Link href={`/${locale}?tool=random`} className={styles.random}>
          {t('showcaseRandomCta')} <ThunderboltOutlined />
        </Link>
      </div>
      <div className={styles.tools}>
        {TOOLS.map((tool, index) => (
          <ShowcaseTool key={tool.id} tool={tool} index={index} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link
          href={`/${locale}/workbench`}
          style={{
            color: 'var(--accent-text)',
            fontWeight: 500,
            textDecoration: 'none',
            fontSize: 15,
          }}
        >
          {t('showcaseSeeAll')} ({ALL_TOOLS.length}) →
        </Link>
      </div>
    </section>
  );
}

function ShowcaseTool({ tool, index }: { tool: WorkbenchTool; index: number }) {
  const locale = useLocale();
  const packs = useTranslations('Workbench.packs');
  return (
    <Link href={`/${locale}${tool.href}`} className={styles.tool}>
      <span className={styles.toolIndex}>{String(index + 1).padStart(2, '0')}</span>
      <span className={styles.toolIcon} style={{ color: tool.accent }}>
        {getWorkbenchIcon(tool.icon)}
      </span>
      <span className={styles.toolCopy}>
        <strong>{packs(`${tool.id}.title`)}</strong>
        <span>{packs(`${tool.id}.description`)}</span>
      </span>
      <ArrowRightOutlined />
    </Link>
  );
}
