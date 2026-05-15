'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRightOutlined } from '@ant-design/icons';
import { buildExampleJwt, decodeJwtToken } from '@/lib/workbench/jwt';
import styles from './heroJwtPreview.module.css';

export function HeroJwtPreview() {
  const locale = useLocale();
  const t = useTranslations('Workbench.jwtDecode');
  const tHero = useTranslations('Hero');
  const [token, setToken] = useState(() => buildExampleJwt());

  const decoded = useMemo(() => decodeJwtToken(token, t('unknownError')), [token, t]);

  return (
    <section className={styles.card} aria-label="JWT live preview">
      <header className={styles.head}>
        <span className={styles.kicker}>{tHero('previewKicker')}</span>
        <Link href={`/${locale}/workbench/jwt-decode`} className={styles.openLink}>
          {tHero('previewOpenTool')} <ArrowRightOutlined />
        </Link>
      </header>

      <label className={styles.tokenWrap}>
        <span className={styles.tokenLabel}>{t('input')}</span>
        <input
          className={styles.tokenInput}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label={t('input')}
        />
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => setToken(buildExampleJwt())}
        >
          {t('loadExample')}
        </button>
      </label>

      {decoded.status === 'valid' ? (
        <>
          <div className={styles.metaRow}>
            <Meta label={t('algorithm')} value={decoded.algorithm} />
            <Meta label={t('type')} value={decoded.tokenType} />
            <Meta
              label={t('expires')}
              value={decoded.expiresAt ?? t('noExpiration')}
              tone={decoded.isExpired ? 'warn' : 'ok'}
            />
          </div>

          <div className={styles.blocks}>
            <Block title={t('header')} body={decoded.headerFormatted} />
            <Block title={t('payload')} body={decoded.payloadFormatted} />
          </div>
        </>
      ) : (
        <div className={styles.invalid}>{decoded.error}</div>
      )}
    </section>
  );
}

function Meta({ label, value, tone }: { label: string; value: string; tone?: 'warn' | 'ok' }) {
  return (
    <div className={styles.meta}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={`${styles.metaValue} ${tone === 'warn' ? styles.metaWarn : ''}`}>{value}</span>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.block}>
      <span className={styles.blockTitle}>{title}</span>
      <pre className={styles.blockBody}>{body}</pre>
    </div>
  );
}
