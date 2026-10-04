'use client';

import { useEffect, useState } from 'react';
import { Modal, Switch, message } from 'antd';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { isTelemetryEnabled, setTelemetryEnabled } from '@/lib/telemetry';
import styles from './privacySettings.module.css';

async function clearLocalStorages(): Promise<void> {
    try {
        window.localStorage.clear();
        window.sessionStorage.clear();
    } catch {
        // bloqueado: nada que borrar
    }
}

async function clearCachesAndSw(): Promise<void> {
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
    }
}

export function PrivacySettings() {
    const t = useTranslations('PrivacySettings');
    const { user } = useCurrentUser();
    const [telemetry, setTelemetry] = useState(false);
    const [modal, modalContextHolder] = Modal.useModal();
    const [messageApi, messageContextHolder] = message.useMessage();

    useEffect(() => {
        setTelemetry(isTelemetryEnabled());
    }, []);

    const toggleTelemetry = (checked: boolean) => {
        setTelemetry(checked);
        setTelemetryEnabled(checked);
    };

    const confirmDanger = (content: string, onOk: () => Promise<void>) => {
        void modal.confirm({
            content,
            okText: t('confirm'),
            okButtonProps: { danger: true },
            cancelText: t('cancel'),
            onOk,
        });
    };

    return (
        <section className={styles.page} aria-label={t('kicker')}>
            {modalContextHolder}
            {messageContextHolder}
            <header className={styles.head}>
                <span className={`tech-label ${styles.kicker}`}>{t('kicker')}</span>
                <h2 className={styles.title}>{t('title')}</h2>
                <p className={styles.intro}>{t('intro')}</p>
            </header>

            <div className={styles.block}>
                <div className={styles.blockHeader}>
                    <h3 className={styles.blockTitle}>{t('telemetryTitle')}</h3>
                    <Switch checked={telemetry} onChange={toggleTelemetry} aria-label={t('telemetryTitle')} />
                </div>
                <p className={styles.hint}>{t('telemetryHint')}</p>
                <p className={styles.state} data-on={telemetry}>
                    {telemetry ? t('telemetryOn') : t('telemetryOff')}
                </p>
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('localTitle')}</h3>
                <p className={styles.hint}>{t('localHint')}</p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.action}
                        onClick={() => {
                            void clearLocalStorages().then(() => messageApi.success(t('clearStorageDone')));
                        }}
                    >
                        {t('clearStorage')}
                    </button>
                    <button
                        type="button"
                        className={styles.action}
                        onClick={() => {
                            void clearCachesAndSw().then(() => messageApi.success(t('clearCachesDone')));
                        }}
                    >
                        {t('clearCaches')}
                    </button>
                    <button
                        type="button"
                        className={`${styles.action} ${styles.actionDanger}`}
                        onClick={() =>
                            confirmDanger(t('hardResetConfirm'), async () => {
                                await clearLocalStorages();
                                await clearCachesAndSw();
                                window.location.reload();
                            })
                        }
                    >
                        {t('hardReset')}
                    </button>
                </div>
                <p className={styles.hint}>{t('hardResetHint')}</p>
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('accountTitle')}</h3>
                <p className={styles.hint}>{t('accountHint')}</p>
                {user ? (
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={`${styles.action} ${styles.actionDanger}`}
                            onClick={() =>
                                confirmDanger(t('deleteAccountConfirm'), async () => {
                                    const res = await fetch('/api/user/account', {
                                        method: 'DELETE',
                                        credentials: 'same-origin',
                                    });
                                    if (res.ok) {
                                        messageApi.success(t('deleteAccountDone'));
                                        await clearLocalStorages();
                                        window.setTimeout(() => window.location.assign('/'), 900);
                                    } else {
                                        messageApi.error(t('deleteAccountError'));
                                    }
                                })
                            }
                        >
                            {t('deleteAccount')}
                        </button>
                    </div>
                ) : (
                    <p className={styles.state}>{t('notLoggedIn')}</p>
                )}
            </div>
        </section>
    );
}
