'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import styles from './workbench.module.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface StoredSnippet {
    id: string;
    title: string;
    tags: string[];
    body: string;
}

const STORAGE_KEY = 'hios-workbench-snippets';

function readSnippets(): StoredSnippet[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function SnippetsShelf() {
    const t = useTranslations('Workbench.snippets');
    const { mode } = useTheme();
    const [messageApi, contextHolder] = message.useMessage();
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [body, setBody] = useState('');
    const [snippets, setSnippets] = useState<StoredSnippet[]>([]);

    useEffect(() => {
        setSnippets(readSnippets());
    }, []);

    const canSave = title.trim().length > 0 && body.trim().length > 0;

    const saveSnippets = (nextSnippets: StoredSnippet[]) => {
        setSnippets(nextSnippets);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnippets));
    };

    const handleSave = () => {
        if (!canSave) return;

        const nextSnippet: StoredSnippet = {
            id: `${Date.now()}`,
            title: title.trim(),
            tags: tags
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            body: body.trim(),
        };

        const nextSnippets = [nextSnippet, ...snippets].slice(0, 8);
        saveSnippets(nextSnippets);
        setTitle('');
        setTags('');
        setBody('');
        messageApi.success(t('saved'));
    };

    const handleDelete = (id: string) => {
        saveSnippets(snippets.filter((snippet) => snippet.id !== id));
    };

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            messageApi.success(t('copied'));
        } catch {
            messageApi.error(t('copyError'));
        }
    };

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
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={!canSave}>
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
                                            </Space>
                                        </div>
                                        <Space>
                                            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(snippet.body)}>
                                                {t('copy')}
                                            </Button>
                                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(snippet.id)}>
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