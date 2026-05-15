'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    CopyOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    BugOutlined,
    BulbOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { useFeedback } from './FeedbackProvider';
import type { FeedbackEntry, FeedbackKind } from '@/lib/feedback/types';
import styles from './feedbackInbox.module.css';

const KIND_OPTIONS: FeedbackKind[] = ['bug', 'idea', 'note'];

function kindIcon(kind: FeedbackKind) {
    switch (kind) {
        case 'error':
            return <ExclamationCircleOutlined />;
        case 'bug':
            return <BugOutlined />;
        case 'idea':
            return <BulbOutlined />;
        case 'note':
            return <FileTextOutlined />;
    }
}

function formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString();
}

function formatMeta(entry: FeedbackEntry): string[] {
    const values = [
        `${entry.source} / ${entry.severity}`,
        entry.locale,
        entry.toolSlug,
        entry.authState,
    ];
    return values.filter((value): value is string => Boolean(value));
}

export function FeedbackInbox() {
    const t = useTranslations('Feedback');
    const { entries, unreadCount, addManual, remove, clear, markRead, serialize } = useFeedback();

    const [draftKind, setDraftKind] = useState<FeedbackKind>('bug');
    const [draftTitle, setDraftTitle] = useState('');
    const [draftBody, setDraftBody] = useState('');
    const [copyHint, setCopyHint] = useState<string | null>(null);

    useEffect(() => {
        if (unreadCount > 0) {
            markRead();
        }
        // markRead intentionally not in deps — solo al montar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const title = draftTitle.trim();
        const body = draftBody.trim();
        if (!title || !body) return;
        addManual(draftKind, title, body);
        setDraftTitle('');
        setDraftBody('');
    };

    const handleCopy = async (entry: FeedbackEntry) => {
        try {
            await navigator.clipboard.writeText(serialize(entry));
            setCopyHint(t('copied'));
            setTimeout(() => setCopyHint(null), 1500);
        } catch {
            setCopyHint(t('copyError'));
            setTimeout(() => setCopyHint(null), 2000);
        }
    };

    return (
        <section className={styles.page} aria-label={t('title')}>
            <header className={styles.head}>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>
            </header>

            <section className={styles.composer} aria-labelledby="feedback-new">
                <h2 id="feedback-new" className={styles.composerTitle}>
                    {t('newEntry')}
                </h2>
                <form className={styles.composerForm} onSubmit={handleSubmit}>
                    <div className={styles.composerKinds} role="radiogroup" aria-label={t('kind')}>
                        {KIND_OPTIONS.map((kind) => (
                            <button
                                key={kind}
                                type="button"
                                role="radio"
                                aria-checked={draftKind === kind}
                                className={`${styles.kindChip} ${draftKind === kind ? styles.kindChipActive : ''}`}
                                onClick={() => setDraftKind(kind)}
                                data-kind={kind}
                            >
                                {kindIcon(kind)} {t(`kinds.${kind}`)}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        className={styles.composerInput}
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        placeholder={t('titlePlaceholder')}
                        aria-label={t('titleField')}
                    />
                    <textarea
                        className={styles.composerTextarea}
                        value={draftBody}
                        onChange={(event) => setDraftBody(event.target.value)}
                        placeholder={t('bodyPlaceholder')}
                        rows={4}
                        aria-label={t('bodyField')}
                    />
                    <div className={styles.composerActions}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={!draftTitle.trim() || !draftBody.trim()}
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </section>

            <section aria-labelledby="feedback-list" className={styles.listSection}>
                <div className={styles.listHeader}>
                    <h2 id="feedback-list" className={styles.composerTitle}>
                        {t('entries')} <span className={styles.countBadge}>{entries.length}</span>
                    </h2>
                    {entries.length > 0 ? (
                        <button type="button" className={styles.clearAllButton} onClick={clear}>
                            {t('clearAll')}
                        </button>
                    ) : null}
                </div>

                {entries.length === 0 ? (
                    <div className={styles.emptyState}>{t('empty')}</div>
                ) : (
                    <ul className={styles.entryList}>
                        {entries.map((entry) => (
                            <li
                                key={entry.id}
                                className={`${styles.entryCard} ${entry.kind === 'error' ? styles.entryCardError : ''}`}
                                data-entry-id={entry.id}
                            >
                                <div className={styles.entryHeader}>
                                    <div className={styles.entryHeaderMeta}>
                                        <span className={`${styles.entryKind} ${styles[`kind_${entry.kind}`]}`}>
                                            {kindIcon(entry.kind)} {t(`kinds.${entry.kind}`)}
                                        </span>
                                        <span className={styles.entryMetaPill}>{t(`sources.${entry.source}`)}</span>
                                        <span className={styles.entryMetaPill}>{t(`severity.${entry.severity}`)}</span>
                                        {entry.occurrences > 1 ? (
                                            <span className={styles.entryMetaPill}>{t('occurrences', { count: entry.occurrences })}</span>
                                        ) : null}
                                    </div>
                                    <time className={styles.entryDate} dateTime={new Date(entry.createdAt).toISOString()}>
                                        {formatDate(entry.lastSeenAt)}
                                    </time>
                                </div>
                                <div className={styles.entryTitle}>{entry.title}</div>
                                <p className={styles.entryBody}>{entry.body}</p>
                                <div className={styles.entryContextRow}>
                                    <span className={styles.entryMetaLabel}>{t('firstSeen')}</span>
                                    <span className={styles.entryMetaValue}>{formatDate(entry.createdAt)}</span>
                                    <span className={styles.entryMetaLabel}>{t('lastSeen')}</span>
                                    <span className={styles.entryMetaValue}>{formatDate(entry.lastSeenAt)}</span>
                                </div>
                                {formatMeta(entry).length > 0 ? (
                                    <div className={styles.entryContextRow}>
                                        <span className={styles.entryMetaLabel}>{t('context')}</span>
                                        <span className={styles.entryMetaValue}>{formatMeta(entry).join(' · ')}</span>
                                    </div>
                                ) : null}
                                {entry.url ? (
                                    <div className={styles.entryMeta}>
                                        <span className={styles.entryMetaLabel}>url</span>{' '}
                                        <span className={styles.entryMetaValue}>{entry.url}</span>
                                    </div>
                                ) : null}
                                <div className={styles.entryMeta}>
                                    <span className={styles.entryMetaLabel}>fingerprint</span>{' '}
                                    <span className={styles.entryMetaValue}>{entry.fingerprint}</span>
                                </div>
                                {entry.stack ? (
                                    <details className={styles.entryStack}>
                                        <summary>{t('stack')}</summary>
                                        <pre className={styles.entryStackBody}>{entry.stack}</pre>
                                    </details>
                                ) : null}
                                <div className={styles.entryActions}>
                                    <button
                                        type="button"
                                        className={styles.entryButton}
                                        onClick={() => handleCopy(entry)}
                                    >
                                        <CopyOutlined /> {t('copy')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.entryButton} ${styles.entryButtonDanger}`}
                                        onClick={() => remove(entry.id)}
                                    >
                                        <DeleteOutlined /> {t('delete')}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {copyHint ? <span className={styles.copyHint} role="status">{copyHint}</span> : null}
            </section>

            <footer className={styles.footer}>
                <span className={styles.footerNote}>{t('localFootnote')}</span>
            </footer>
        </section>
    );
}
