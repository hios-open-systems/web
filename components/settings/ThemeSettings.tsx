'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { CheckOutlined } from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeContext';
import { DEFAULT_ACCENT, isValidHex, THEME_PRESETS, findPresetByAccent } from '@/lib/themes/config';
import {
    type SavedTheme,
    addSavedTheme,
    readSavedThemes,
    removeSavedTheme,
    writeSavedThemes,
} from '@/lib/themes/saved';
import styles from './themeSettings.module.css';

export function ThemeSettings() {
    const t = useTranslations('Settings');
    const locale = useLocale();
    const { accent, mode, toggleTheme, setAccent, applyPreset, isAuthenticated, isSyncing, syncState, syncError, syncCurrentAccent } = useTheme();
    const [hexDraft, setHexDraft] = useState(accent);
    const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
    const [themeName, setThemeName] = useState('');

    useEffect(() => {
        setHexDraft(accent);
    }, [accent]);

    useEffect(() => {
        setSavedThemes(readSavedThemes());
    }, []);

    const persistThemes = (next: SavedTheme[]) => {
        setSavedThemes(next);
        writeSavedThemes(next);
    };

    const saveCurrentTheme = () => {
        const next = addSavedTheme(savedThemes, themeName, accent, mode);
        if (next === savedThemes) return;
        persistThemes(next);
        setThemeName('');
    };

    const applySavedTheme = (theme: SavedTheme) => {
        setAccent(theme.accent);
        if (mode !== theme.mode) toggleTheme();
    };

    const activePreset = findPresetByAccent(accent);
    const draftValid = isValidHex(hexDraft);
    const syncStatusLabel = !isAuthenticated
        ? t('localMode')
        : syncState === 'checking' || isSyncing
            ? t('syncing')
            : syncState === 'needs-import'
                ? t('needsImport')
                : syncState === 'unavailable'
                    ? t('syncUnavailable')
                    : syncState === 'error'
                        ? t('syncErrorState')
                        : t('accountMode');
    const summaryCards = [
        {
            label: t('summarySyncLabel'),
            value: syncStatusLabel,
            hint: isAuthenticated ? t('summarySyncHintAccount') : t('summarySyncHintLocal'),
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

    const renderStatus = () => {
        return <span className={styles.syncMeta}>{syncStatusLabel}</span>;
    };

    const commitHex = () => {
        if (draftValid) setAccent(hexDraft);
    };

    return (
        <section className={styles.page}>
            <header className={styles.head}>
                <Link
                    href={`/${locale}/workbench`}
                    style={{ color: '#f59e0b', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}
                >
                    <ArrowLeftOutlined /> Workbench
                </Link>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>
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

            <section className={styles.section} aria-label={t('syncTitle')}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t('syncTitle')}</h2>
                    {renderStatus()}
                </div>
                <p className={styles.sectionHint}>{isAuthenticated ? t('syncHintAccount') : t('syncHintLocal')}</p>
                {syncState === 'needs-import' ? (
                    <div className={styles.syncActionRow}>
                        <button
                            type="button"
                            className={styles.syncButton}
                            onClick={() => void syncCurrentAccent()}
                            disabled={isSyncing}
                        >
                            {t('syncNow')}
                        </button>
                    </div>
                ) : null}
                {syncError ? (
                    <Alert
                        type="warning"
                        showIcon
                        className={styles.syncAlert}
                        message={t('syncWarningTitle')}
                        description={syncError}
                    />
                ) : null}
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
                                <span
                                    className={styles.presetSwatch}
                                    style={{ background: preset.accent }}
                                    aria-hidden
                                >
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
                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={() => setAccent(DEFAULT_ACCENT)}
                    >
                        {t('reset')}
                    </button>
                </div>
                {!draftValid ? <span className={styles.errorText}>{t('invalidHex')}</span> : null}
            </section>

            <section className={styles.section} aria-labelledby="theme-saved">
                <div className={styles.sectionHeader}>
                    <h2 id="theme-saved" className={styles.sectionTitle}>{t('savedTitle')}</h2>
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
                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={saveCurrentTheme}
                        disabled={!themeName.trim()}
                    >
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
                                    <span
                                        className={styles.presetSwatch}
                                        style={{ background: theme.accent }}
                                        aria-hidden
                                    />
                                    <span className={styles.savedLabel}>
                                        <span className={styles.savedName}>{theme.name}</span>
                                        <span className={styles.savedMode}>
                                            {theme.mode === 'dark' ? t('savedModeDark') : t('savedModeLight')}
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

            <footer className={styles.footer}>
                <span className={styles.footerNote}>{isAuthenticated ? t('accountFootnote') : t('localFootnote')}</span>
            </footer>
        </section>
    );
}
