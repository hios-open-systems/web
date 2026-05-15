'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeContext';
import { DEFAULT_ACCENT, isValidHex, THEME_PRESETS, findPresetByAccent } from '@/lib/themes/config';
import styles from './themeSettings.module.css';

export function ThemeSettings() {
    const t = useTranslations('Settings');
    const { accent, setAccent, applyPreset, isAuthenticated, isSyncing, syncState, syncError, syncCurrentAccent } = useTheme();
    const [hexDraft, setHexDraft] = useState(accent);

    useEffect(() => {
        setHexDraft(accent);
    }, [accent]);

    const activePreset = findPresetByAccent(accent);
    const draftValid = isValidHex(hexDraft);

    const renderStatus = () => {
        if (!isAuthenticated) {
            return <span className={styles.syncMeta}>{t('localMode')}</span>;
        }
        if (syncState === 'checking' || isSyncing) {
            return <span className={styles.syncMeta}>{t('syncing')}</span>;
        }
        if (syncState === 'needs-import') {
            return <span className={styles.syncMeta}>{t('needsImport')}</span>;
        }
        if (syncState === 'error') {
            return <span className={styles.syncMeta}>{t('syncErrorState')}</span>;
        }
        return <span className={styles.syncMeta}>{t('accountMode')}</span>;
    };

    const commitHex = () => {
        if (draftValid) setAccent(hexDraft);
    };

    return (
        <section className={styles.page}>
            <header className={styles.head}>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>
            </header>

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
