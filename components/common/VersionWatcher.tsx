'use client';

import React, { useEffect, useRef } from 'react';
import { Button, Space, Typography, notification } from 'antd';
import { useTranslations } from 'next-intl';
import { DEPLOY_VERSION_FALLBACK } from '@/lib/appVersion';

const VERSION_NOTIFICATION_KEY = 'hios-version-update';
const VERSION_POLL_INTERVAL_MS = 5 * 60 * 1000;

interface VersionPayload {
    version?: string;
}

async function fetchLatestVersion(): Promise<string | null> {
    const response = await fetch('/api/version', {
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache' },
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as VersionPayload;
    return typeof payload.version === 'string' ? payload.version : null;
}

export function VersionWatcher({ currentVersion }: { currentVersion: string }) {
    const t = useTranslations('VersionWatcher');
    const [api, contextHolder] = notification.useNotification();
    const dismissedVersionRef = useRef<string | null>(null);

    useEffect(() => {
        if (!currentVersion || currentVersion === DEPLOY_VERSION_FALLBACK) {
            return undefined;
        }

        let cancelled = false;

        const dismissVersion = (nextVersion: string) => {
            dismissedVersionRef.current = nextVersion;
            api.destroy(VERSION_NOTIFICATION_KEY);
        };

        const openVersionNotice = (nextVersion: string) => {
            api.open({
                key: VERSION_NOTIFICATION_KEY,
                message: t('title'),
                description: (
                    <Space direction="vertical" size={10}>
                        <Typography.Text>{t('description')}</Typography.Text>
                        <Space wrap>
                            <Button type="primary" size="small" onClick={() => window.location.reload()}>
                                {t('reload')}
                            </Button>
                            <Button size="small" onClick={() => dismissVersion(nextVersion)}>
                                {t('later')}
                            </Button>
                        </Space>
                    </Space>
                ),
                duration: 0,
                placement: 'topRight',
                closeIcon: false,
            });
        };

        const checkForNewVersion = async () => {
            if (document.visibilityState === 'hidden') {
                return;
            }

            try {
                const latestVersion = await fetchLatestVersion();
                if (
                    cancelled ||
                    !latestVersion ||
                    latestVersion === currentVersion ||
                    latestVersion === dismissedVersionRef.current
                ) {
                    return;
                }

                openVersionNotice(latestVersion);
            } catch {
                // Best effort only. Failing closed is fine here.
            }
        };

        const handleVisible = () => {
            if (document.visibilityState === 'visible') {
                void checkForNewVersion();
            }
        };

        const timerId = window.setInterval(() => {
            void checkForNewVersion();
        }, VERSION_POLL_INTERVAL_MS);

        document.addEventListener('visibilitychange', handleVisible);
        window.addEventListener('focus', handleVisible);

        return () => {
            cancelled = true;
            window.clearInterval(timerId);
            document.removeEventListener('visibilitychange', handleVisible);
            window.removeEventListener('focus', handleVisible);
            api.destroy(VERSION_NOTIFICATION_KEY);
        };
    }, [api, currentVersion, t]);

    return contextHolder;
}