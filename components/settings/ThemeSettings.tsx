'use client';
import { PageIntro } from '@/components/ui/PageIntro';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { CheckOutlined } from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeContext';
import { DEFAULT_ACCENT, isValidHex, THEME_PRESETS, findPresetByAccent } from '@/lib/themes/config';
import { SKINS } from '@/lib/themes/skins';
import {
  type SavedTheme,
  addSavedTheme,
  readSavedThemes,
  removeSavedTheme,
  writeSavedThemes,
} from '@/lib/themes/saved';
import styles from './themeSettings.module.css';
import { ThemeSaveStatus } from './ThemeSaveStatus';
import { useThemeSaveStatus } from './useThemeSaveStatus';

export function ThemeSettings() {
  const t = useTranslations('Settings');
  const locale = useLocale();
  const {
    accent,
    mode,
    skin,
    toggleTheme,
    setAccent,
    setSkin,
    applyPreset,
  } = useTheme();
  const [hexDraft, setHexDraft] = useState(accent);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [themeName, setThemeName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHexDraft(accent);
  }, [accent]);

  useEffect(() => {
    setMounted(true);
    setSavedThemes(readSavedThemes());
  }, []);

  const persistThemes = (next: SavedTheme[]) => {
    setSavedThemes(next);
    writeSavedThemes(next);
  };

  const saveCurrentTheme = () => {
    const next = addSavedTheme(savedThemes, themeName, accent, mode, skin);
    if (next === savedThemes) return;
    persistThemes(next);
    setThemeName('');
  };

  const applySavedTheme = (theme: SavedTheme) => {
    setAccent(theme.accent);
    setSkin(theme.skin ?? 'datasheet');
    if (mode !== theme.mode) toggleTheme();
  };

  const activePreset = findPresetByAccent(accent);
  const draftValid = isValidHex(hexDraft);
  const saveStatus = useThemeSaveStatus();
  const summaryCards = [
    {
      label: t('summarySyncLabel'),
      value: saveStatus.localLabel,
      hint: saveStatus.accountLabel,
    },
    {
      label: t('summaryPresetLabel'),
      value: activePreset?.label ?? t('summaryPresetCustom'),
      hint: activePreset ? t('summaryPresetHintPreset') : t('summaryPresetHintCustom'),
    },
    {
      label: t('summaryAccentLabel'),
      value: accent.toUpperCase(),
      hint: t('summaryAccentHint'),
    },
  ];

  const commitHex = () => {
    if (draftValid) setAccent(hexDraft);
  };

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <Link
          href={`/${locale}/workbench`}
          style={{
            color: 'var(--accent-text)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <ArrowLeftOutlined /> Workbench
        </Link>
        <PageIntro eyebrow="HIOS / WORKBENCH" title={t('title')} description={t('subtitle')} area="software" compact />
      </header>

      <section className={styles.summaryGrid} aria-label={t('summaryRegion')}>
        {summaryCards.map((card) => (
          <article key={card.label} className={styles.summaryCard}>
            <span className={styles.summaryLabel}>{card.label}</span>
            <strong className={styles.summaryValue}>{card.value}</strong>
            <span className={styles.summaryHint}>{card.hint}</span>
          </article>
        ))}
      </section>

      <ThemeSaveStatus />

      <section className={styles.section} aria-labelledby="theme-skins">
        <div className={styles.sectionHeader}>
          <h2 id="theme-skins" className={styles.sectionTitle}>
            {t('skinTitle')}
          </h2>
          <span className={styles.sectionHint}>{t('skinHint')}</span>
        </div>
        <div className={styles.skinRow} role="radiogroup" aria-label={t('skinTitle')}>
          {SKINS.map((item) => {
            const selected = (mounted ? skin : 'datasheet') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.skinCard} ${selected ? styles.skinCardActive : ''}`}
                onClick={() => setSkin(item.id)}
                data-skin-id={item.id}
              >
                <span className={styles.skinSwatch} data-skin-preview={item.id} aria-hidden>
                  <span className={styles.skinSwatchLine} />
                  <span className={styles.skinSwatchLine} />
                  <span className={styles.skinSwatchDot} />
                </span>
                <span className={styles.skinBody}>
                  <span className={styles.skinLabel}>
                    {item.label}
                    {selected ? <CheckOutlined /> : null}
                  </span>
                  <span className={styles.skinDescription}>{t(`skins.${item.id}`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="theme-presets">
        <div className={styles.sectionHeader}>
          <h2 id="theme-presets" className={styles.sectionTitle}>
            {t('presets')}
          </h2>
          <span className={styles.sectionHint}>{t('presetsHint')}</span>
        </div>
        <div className={styles.presetRow} role="radiogroup" aria-label={t('presets')}>
          {THEME_PRESETS.map((preset) => {
            const selected = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.presetChip} ${selected ? styles.presetChipActive : ''}`}
                onClick={() => applyPreset(preset.id)}
                data-preset-id={preset.id}
              >
                <span className={styles.presetSwatch} style={{ background: preset.accent }} aria-hidden>
                  {selected ? <CheckOutlined /> : null}
                </span>
                <span className={styles.presetLabel}>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="theme-custom">
        <div className={styles.sectionHeader}>
          <h2 id="theme-custom" className={styles.sectionTitle}>
            {t('custom')}
          </h2>
          <span className={styles.sectionHint}>{t('customHint')}</span>
        </div>
        <div className={styles.customRow}>
          <label className={styles.customField}>
            <span className={styles.customLabel}>{t('hex')}</span>
            <div className={styles.hexInputWrap}>
              <span
                className={styles.hexSwatch}
                style={{ background: draftValid ? hexDraft : '#cbd5e1' }}
                aria-hidden
              />
              <input
                type="text"
                value={hexDraft}
                onChange={(event) => setHexDraft(event.target.value)}
                onBlur={commitHex}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
                className={styles.hexInput}
                spellCheck={false}
                placeholder="#f59e0b"
                aria-invalid={!draftValid}
                data-testid="accent-hex-input"
              />
            </div>
          </label>
          <button type="button" className={styles.resetButton} onClick={() => setAccent(DEFAULT_ACCENT)}>
            {t('reset')}
          </button>
        </div>
        {!draftValid ? <span className={styles.errorText}>{t('invalidHex')}</span> : null}
      </section>

      <section className={styles.section} aria-labelledby="theme-saved">
        <div className={styles.sectionHeader}>
          <h2 id="theme-saved" className={styles.sectionTitle}>
            {t('savedTitle')}
          </h2>
          <span className={styles.sectionHint}>{t('savedHint')}</span>
        </div>
        <div className={styles.customRow}>
          <label className={styles.customField}>
            <span className={styles.customLabel}>{t('savedName')}</span>
            <div className={styles.hexInputWrap}>
              <input
                type="text"
                value={themeName}
                onChange={(event) => setThemeName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveCurrentTheme();
                }}
                className={styles.hexInput}
                placeholder={t('savedNamePlaceholder')}
                maxLength={40}
                data-testid="saved-theme-name"
              />
            </div>
          </label>
          <button type="button" className={styles.resetButton} onClick={saveCurrentTheme} disabled={!themeName.trim()}>
            {t('savedSave')}
          </button>
        </div>
        {savedThemes.length === 0 ? (
          <span className={styles.sectionHint}>{t('savedEmpty')}</span>
        ) : (
          <div className={styles.savedRow} role="list">
            {savedThemes.map((theme) => (
              <div key={theme.id} className={styles.savedChip} role="listitem">
                <button
                  type="button"
                  className={styles.savedApply}
                  onClick={() => applySavedTheme(theme)}
                  title={t('savedApply')}
                >
                  <span className={styles.presetSwatch} style={{ background: theme.accent }} aria-hidden />
                  <span className={styles.savedLabel}>
                    <span className={styles.savedName}>{theme.name}</span>
                    <span className={styles.savedMode}>
                      {theme.mode === 'dark' ? t('savedModeDark') : t('savedModeLight')}
                      {theme.skin && theme.skin !== 'datasheet' ? ` · ${theme.skin}` : ''}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t('savedDelete')}
                  className={styles.savedDelete}
                  onClick={() => persistThemes(removeSavedTheme(savedThemes, theme.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section} aria-label={t('preview')}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('preview')}</h2>
          <span className={styles.sectionHint}>{t('previewHint')}</span>
        </div>
        <div className={styles.previewBlock}>
          <span className={styles.previewKicker}>HIOS · {t('previewTagline')}</span>
          <div className={styles.previewSurface}>
            <div className={styles.previewBadge}>NEW</div>
            <button type="button" className={styles.previewPrimary}>
              {t('previewButton')}
            </button>
            <span className={styles.previewLink}>{t('previewLink')}</span>
          </div>
        </div>
      </section>

    </section>
  );
}
