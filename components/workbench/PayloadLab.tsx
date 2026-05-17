'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, LinkOutlined, ReloadOutlined, ShrinkOutlined, ExpandOutlined, ClearOutlined } from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { parsePayloadInput } from '@/lib/workbench/payload';
import { PayloadInspector } from './PayloadInspector';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const { TextArea } = Input;

const EXAMPLE_PAYLOAD = {
    requestId: 'REQ-42',
    user: {
        id: 18,
        role: 'maintainer',
        locale: 'es-AR',
    },
    flags: ['beta', 'workbench'],
    meta: {
        source: 'landing-preview',
        retries: 0,
    },
};

export function PayloadLab() {
    const t = useTranslations('Workbench.payload');
    const { mode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const hydratedFromUrl = useRef(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [input, setInput] = useState(JSON.stringify(EXAMPLE_PAYLOAD, null, 2));
    const [viewMode, setViewMode] = useState<'pretty' | 'minified'>('pretty');
    const [pathSearch, setPathSearch] = useState('');

    useEffect(() => {
        if (hydratedFromUrl.current) return;

        const payloadParam = searchParams.get('payload');
        const modeParam = searchParams.get('view');

        if (payloadParam) {
            setInput(payloadParam);
        }
        if (modeParam === 'pretty' || modeParam === 'minified') {
            setViewMode(modeParam);
        }

        hydratedFromUrl.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!hydratedFromUrl.current) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set('payload', input);
        params.set('view', viewMode);

        const nextQuery = params.toString();
        const currentQuery = searchParams.toString();
        if (nextQuery !== currentQuery) {
            router.replace(`${pathname}?${nextQuery}`, { scroll: false });
        }
    }, [input, pathname, router, searchParams, viewMode]);

    const parsedState = useMemo(() => {
        return parsePayloadInput(input, viewMode, t('unknownError'));
    }, [input, t, viewMode]);

    const filteredPaths = useMemo(() => {
        if (parsedState.status !== 'valid') return [];

        const query = pathSearch.trim().toLowerCase();
        if (!query) return parsedState.paths.slice(0, 18);

        return parsedState.paths
            .filter((entry) => {
                return entry.path.toLowerCase().includes(query)
                    || entry.type.toLowerCase().includes(query)
                    || entry.preview.toLowerCase().includes(query);
            })
            .slice(0, 18);
    }, [parsedState, pathSearch]);

    const handleCopy = async (value: string, successMessage: string) => {
        try {
            await navigator.clipboard.writeText(value);
            messageApi.success(successMessage);
        } catch {
            messageApi.error(t('copyError'));
        }
    };

    const handleLoadExample = () => {
        setInput(JSON.stringify(EXAMPLE_PAYLOAD, null, 2));
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}${pathname}?${searchParams.toString()}`;
        await handleCopy(shareUrl, t('linkCopied'));
    };

    const handleCopyPath = async (path: string) => {
        await handleCopy(path, t('pathCopied'));
    };

    const themeVars = {
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
    } as React.CSSProperties;

    return (
        <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
            {contextHolder}
            <ToolHeader
                eyebrow={t('badge')}
                title={t('title')}
                description={t('subtitle')}
                locality="local"
                guideId="payload"
                actions={
                    <Space wrap>
                        <Button icon={<ReloadOutlined />} onClick={handleLoadExample}>{t('loadExample')}</Button>
                        <Button icon={viewMode === 'pretty' ? <ShrinkOutlined /> : <ExpandOutlined />} onClick={() => setViewMode(viewMode === 'pretty' ? 'minified' : 'pretty')}>
                            {viewMode === 'pretty' ? t('minify') : t('prettify')}
                        </Button>
                        <Button icon={<CopyOutlined />} onClick={() => handleCopy(parsedState.status === 'valid' ? parsedState.formatted : input, t('copied'))}>
                            {t('copyOutput')}
                        </Button>
                        <Button icon={<LinkOutlined />} onClick={handleShare}>{t('copyLink')}</Button>
                        <Button icon={<ClearOutlined />} onClick={() => setInput('')}>{t('clear')}</Button>
                    </Space>
                }
            />

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={12}>
                    <Card title={t('input')} className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
                        <TextArea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            autoSize={{ minRows: 18, maxRows: 28 }}
                            className={styles.textArea}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title={t('output')}
                        extra={
                            parsedState.status === 'valid'
                                ? <Tag color="green">{t('valid')}</Tag>
                                : <Tag color="red">{t('invalid')}</Tag>
                        }
                        className={styles.sectionCard}
                        styles={{ body: { padding: 20 } }}
                    >
                        {parsedState.status === 'valid' ? (
                            <Space direction="vertical" size={16} className={styles.stackFull}>
                                <pre className={styles.codeBlock}>
                                    {parsedState.formatted}
                                </pre>
                                <Text className={styles.subtleText}>{t('outputHint')}</Text>
                            </Space>
                        ) : (
                            <Space direction="vertical" size={12}>
                                <Text strong>{t('errorTitle')}</Text>
                                <Text style={{ color: '#ef4444' }}>{parsedState.error}</Text>
                            </Space>
                        )}
                    </Card>
                </Col>
            </Row>

            <PayloadInspector
                metrics={parsedState.metrics}
                paths={filteredPaths}
                searchTerm={pathSearch}
                onSearchTermChange={setPathSearch}
                onCopyPath={handleCopyPath}
            />
        </Space>
    );
}