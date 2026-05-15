'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, DeleteOutlined, LinkOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { SnippetRecord } from '@/lib/snippets';
import {
    clearLocalSnippets,
    createSnippetDraft,
    readLocalSnippets,
    readRemoteSnippetsCache,
    writeLocalSnippets,
    writeRemoteSnippetsCache,
} from '@/lib/workbench/snippetsStorage';
import {
    createRemoteSnippet,
    deleteRemoteSnippet,
    fetchRemoteSnippets,
    importRemoteSnippets,
    updateRemoteSnippet,
} from '@/lib/workbench/snippetsClient';
import styles from './workbench.module.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

function parseTagInput(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function SnippetsShelf() {
    const t = useTranslations('Workbench.snippets');
    const locale = useLocale();
    const { mode } = useTheme();
    const { user, isLoading: isUserLoading } = useCurrentUser();
    const [messageApi, contextHolder] = message.useMessage();
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [body, setBody] = useState('');
    const [snippets, setSnippets] = useState<SnippetRecord[]>([]);
    const [localSnippets, setLocalSnippets] = useState<SnippetRecord[]>([]);
    const [isRemoteLoading, setIsRemoteLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    useEffect(() => {
        const nextLocalSnippets = readLocalSnippets();
        setLocalSnippets(nextLocalSnippets);
        setSnippets(nextLocalSnippets);
    }, []);

    const canSave = title.trim().length > 0 && body.trim().length > 0;

    const refreshRemoteSnippets = useCallback(async () => {
        if (!user) return;

        const cached = readRemoteSnippetsCache(user.id);
        if (cached.length > 0) {
            setSnippets(cached);
        }

        setIsRemoteLoading(true);
        try {
            const remoteSnippets = await fetchRemoteSnippets();
            setSnippets(remoteSnippets);
            writeRemoteSnippetsCache(user.id, remoteSnippets);
            setSyncError(null);
        } catch (error) {
            setSyncError(error instanceof Error ? error.message : t('syncLoadError'));
        } finally {
            setIsRemoteLoading(false);
        }
    }, [t, user]);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            const nextLocalSnippets = readLocalSnippets();
            setLocalSnippets(nextLocalSnippets);
            setSnippets(nextLocalSnippets);
            setSyncError(null);
            return;
        }
        void refreshRemoteSnippets();
    }, [isUserLoading, refreshRemoteSnippets, user]);

    const handleSave = async () => {
        if (!canSave || isSaving) return;

        const tagList = parseTagInput(tags);
        setIsSaving(true);

        try {
            if (!user) {
                const nextSnippet = createSnippetDraft({
                    title,
                    body,
                    tags: tagList,
                });
                const nextSnippets = [nextSnippet, ...localSnippets].slice(0, 8);
                writeLocalSnippets(nextSnippets);
                setLocalSnippets(nextSnippets);
                setSnippets(nextSnippets);
            } else {
                const snippet = await createRemoteSnippet({
                    title,
                    body,
                    tags: tagList,
                    isPublic: false,
                });
                const nextSnippets = [snippet, ...snippets];
                setSnippets(nextSnippets);
                writeRemoteSnippetsCache(user.id, nextSnippets);
                setSyncError(null);
            }

            setTitle('');
            setTags('');
            setBody('');
            messageApi.success(t('saved'));
        } catch (error) {
            messageApi.error(error instanceof Error ? error.message : t('saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            if (!user) {
                const nextSnippets = localSnippets.filter((snippet) => snippet.id !== id);
                writeLocalSnippets(nextSnippets);
                setLocalSnippets(nextSnippets);
                setSnippets(nextSnippets);
                return;
            }

            await deleteRemoteSnippet(id);
            const nextSnippets = snippets.filter((snippet) => snippet.id !== id);
            setSnippets(nextSnippets);
            writeRemoteSnippetsCache(user.id, nextSnippets);
            setSyncError(null);
        } catch (error) {
            messageApi.error(error instanceof Error ? error.message : t('deleteError'));
        }
    };

    const handleVisibilityToggle = async (snippet: SnippetRecord) => {
        if (!user) return;

        try {
            const updated = await updateRemoteSnippet(snippet.id, { isPublic: !snippet.isPublic });
            const nextSnippets = snippets.map((entry) => (entry.id === snippet.id ? updated : entry));
            setSnippets(nextSnippets);
            writeRemoteSnippetsCache(user.id, nextSnippets);
            messageApi.success(updated.isPublic ? t('madePublic') : t('madePrivate'));
        } catch (error) {
            messageApi.error(error instanceof Error ? error.message : t('visibilityError'));
        }
    };

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            messageApi.success(t('copied'));
        } catch {
            messageApi.error(t('copyError'));
        }
    };

    const handleShare = async (snippetId: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${locale}/s/${snippetId}`);
            messageApi.success(t('shareCopied'));
        } catch {
            messageApi.error(t('shareError'));
        }
    };

    const handleImportLocal = async () => {
        if (!user || localSnippets.length === 0 || isImporting) return;

        setIsImporting(true);
        try {
            const result = await importRemoteSnippets(
                localSnippets.map((snippet) => ({
                    title: snippet.title,
                    body: snippet.body,
                    tags: snippet.tags,
                    isPublic: false,
                })),
            );

            clearLocalSnippets();
            setLocalSnippets([]);
            messageApi.success(t('imported', result));
            await refreshRemoteSnippets();
        } catch (error) {
            messageApi.error(error instanceof Error ? error.message : t('importError'));
        } finally {
            setIsImporting(false);
        }
    };

    const statusText = user
        ? t('accountStatus', { login: user.login })
        : t('localStatus');

    const themeVars = useMemo(() => ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#64748b',
    } as React.CSSProperties), [mode]);

    return (
        <Card className={styles.sectionCard} style={themeVars} styles={{ body: { padding: 24 } }}>
            {contextHolder}
            <Space direction="vertical" size={18} className={styles.stackFull}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>{t('title')}</Title>
                    <Text className={styles.subtleText}>{t('subtitle')}</Text>
                </div>

                <div className={styles.snippetStatusRow}>
                    <Space wrap>
                        <Tag color={user ? 'blue' : 'gold'}>{user ? t('cloudBadge') : t('localBadge')}</Tag>
                        {isUserLoading ? <Text className={styles.subtleText}>{t('authChecking')}</Text> : <Text className={styles.subtleText}>{statusText}</Text>}
                    </Space>
                    {user && isRemoteLoading ? <Text className={styles.subtleText}>{t('syncing')}</Text> : null}
                </div>

                {syncError ? (
                    <Alert
                        type="warning"
                        showIcon
                        className={styles.snippetBanner}
                        message={t('syncWarningTitle')}
                        description={syncError}
                    />
                ) : null}

                {user && localSnippets.length > 0 ? (
                    <Alert
                        type="info"
                        showIcon
                        className={styles.snippetBanner}
                        message={t('importTitle', { count: localSnippets.length })}
                        description={t('importBody')}
                        action={(
                            <Button size="small" icon={<UploadOutlined />} loading={isImporting} onClick={handleImportLocal}>
                                {t('importAction')}
                            </Button>
                        )}
                    />
                ) : null}

                <Space direction="vertical" size={10} className={styles.snippetInputGroup}>
                    <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={t('titlePlaceholder')}
                        size="large"
                    />
                    <Input
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        placeholder={t('tagsPlaceholder')}
                        size="large"
                    />
                    <TextArea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder={t('bodyPlaceholder')}
                        autoSize={{ minRows: 4, maxRows: 8 }}
                    />
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSave()} disabled={!canSave} loading={isSaving}>
                        {t('save')}
                    </Button>
                </Space>

                {snippets.length === 0 ? (
                    <Empty description={t('empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <Space direction="vertical" size={12} className={styles.stackFull}>
                        {snippets.map((snippet) => (
                            <Card
                                key={snippet.id}
                                size="small"
                                className={styles.snippetCard}
                                styles={{ body: { padding: 16 } }}
                            >
                                <Space direction="vertical" size={12} className={styles.stackFull}>
                                    <div className={styles.snippetHeader}>
                                        <div>
                                            <Text strong className={styles.snippetTitle}>{snippet.title}</Text>
                                            <Space size={[6, 6]} wrap>
                                                {snippet.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                                                {user ? (
                                                    <Tag color={snippet.isPublic ? 'green' : 'default'}>
                                                        {snippet.isPublic ? t('publicLabel') : t('privateLabel')}
                                                    </Tag>
                                                ) : null}
                                            </Space>
                                            <Text className={styles.subtleText}>{new Date(snippet.updatedAt).toLocaleString()}</Text>
                                        </div>
                                        <Space>
                                            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(snippet.body)}>
                                                {t('copy')}
                                            </Button>
                                            {user ? (
                                                <Button size="small" onClick={() => void handleVisibilityToggle(snippet)}>
                                                    {snippet.isPublic ? t('makePrivate') : t('makePublic')}
                                                </Button>
                                            ) : null}
                                            {user && snippet.isPublic ? (
                                                <Button size="small" icon={<LinkOutlined />} onClick={() => void handleShare(snippet.id)}>
                                                    {t('share')}
                                                </Button>
                                            ) : null}
                                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => void handleDelete(snippet.id)}>
                                                {t('delete')}
                                            </Button>
                                        </Space>
                                    </div>
                                    <pre className={styles.snippetPre}>
                                        {snippet.body}
                                    </pre>
                                </Space>
                            </Card>
                        ))}
                    </Space>
                )}
            </Space>
        </Card>
    );
}