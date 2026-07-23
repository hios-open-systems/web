'use client';

import { useEffect, useState } from 'react';
import { Modal, Switch, message } from 'antd';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { isTelemetryEnabled, setTelemetryEnabled } from '@/lib/telemetry';
import styles from './privacySettings.module.css';

const COPY = {
    es: {
        kicker: 'Datos y privacidad',
        title: 'Tus datos, tus reglas',
        intro:
            'Por default este sitio no trackea, no notifica y no pide permisos. Todo lo que se guarda o comparte está listado acá, y cada cosa tiene su botón de borrado.',
        telemetryTitle: 'Telemetría anónima (opt-in)',
        telemetryHint:
            'Apagada por default. Si la activás, se envía: evento (vista de página / tool abierta), ruta, idioma, tool, navegador (user-agent), página de origen y país a nivel Cloudflare — nunca tu IP. Los agregados se publican abiertos en /stats.',
        telemetryOn: 'Activada — gracias por aportar a las stats abiertas',
        telemetryOff: 'Apagada (default)',
        localTitle: 'Datos locales (viven solo en tu navegador)',
        localHint:
            'Tema, accent y skin elegidos · temas guardados · historial local de tools usadas · notas y borradores de las tools. Nada de esto sale de tu máquina.',
        clearStorage: 'Borrar storage local',
        clearStorageDone: 'localStorage y sessionStorage borrados.',
        clearCaches: 'Borrar caches y service worker',
        clearCachesDone: 'Caches y service worker eliminados.',
        hardReset: 'Hard reset',
        hardResetHint: 'Borra todo lo anterior y recarga la página como si fuera tu primera visita.',
        hardResetConfirm: '¿Borrar todos los datos locales del sitio y recargar?',
        accountTitle: 'Datos de cuenta (si iniciaste sesión)',
        accountHint:
            'Sesión, snippets sincronizados y preferencias. Borrar la cuenta elimina todo eso de la base y anonimiza cualquier evento asociado. Irreversible.',
        deleteAccount: 'Eliminar mi cuenta y todos mis datos',
        deleteAccountConfirm:
            'Esto borra tu cuenta, snippets y preferencias del servidor, y anonimiza el resto. No hay vuelta atrás. ¿Seguro?',
        deleteAccountDone: 'Cuenta eliminada. Chau, y gracias por pasar.',
        deleteAccountError: 'No se pudo borrar la cuenta. Probá de nuevo o escribime.',
        notLoggedIn: 'No hay sesión iniciada — no guardamos nada tuyo en el servidor.',
        confirm: 'Borrar',
        cancel: 'Cancelar',
    },
    en: {
        kicker: 'Data & privacy',
        title: 'Your data, your rules',
        intro:
            'By default this site does not track, notify, or ask for permissions. Everything stored or shared is listed here, and each item has its own delete button.',
        telemetryTitle: 'Anonymous telemetry (opt-in)',
        telemetryHint:
            'Off by default. If you enable it, we send: event (page view / tool open), path, language, tool, browser (user-agent), referrer and Cloudflare-level country — never your IP. Aggregates are published openly at /stats.',
        telemetryOn: 'On — thanks for feeding the open stats',
        telemetryOff: 'Off (default)',
        localTitle: 'Local data (lives only in your browser)',
        localHint:
            'Chosen theme, accent and skin · saved themes · local history of used tools · tool notes and drafts. None of this leaves your machine.',
        clearStorage: 'Clear local storage',
        clearStorageDone: 'localStorage and sessionStorage cleared.',
        clearCaches: 'Clear caches & service worker',
        clearCachesDone: 'Caches and service worker removed.',
        hardReset: 'Hard reset',
        hardResetHint: 'Clears everything above and reloads the page as if it were your first visit.',
        hardResetConfirm: 'Clear all local site data and reload?',
        accountTitle: 'Account data (if signed in)',
        accountHint:
            'Session, synced snippets and preferences. Deleting your account removes all of that from the database and anonymizes any associated events. Irreversible.',
        deleteAccount: 'Delete my account and all my data',
        deleteAccountConfirm:
            'This deletes your account, snippets and preferences from the server, and anonymizes the rest. There is no undo. Sure?',
        deleteAccountDone: 'Account deleted. Bye, and thanks for stopping by.',
        deleteAccountError: 'Could not delete the account. Try again or write me.',
        notLoggedIn: 'Not signed in — we store nothing of yours on the server.',
        confirm: 'Delete',
        cancel: 'Cancel',
    },
} as const;

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
    const locale = useLocale();
    const t = COPY[locale as keyof typeof COPY] ?? COPY.en;
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
            okText: t.confirm,
            okButtonProps: { danger: true },
            cancelText: t.cancel,
            onOk,
        });
    };

    return (
        <section className={styles.page} aria-label={t.kicker}>
            {modalContextHolder}
            {messageContextHolder}
            <header className={styles.head}>
                <span className={`tech-label ${styles.kicker}`}>{t.kicker}</span>
                <h2 className={styles.title}>{t.title}</h2>
                <p className={styles.intro}>{t.intro}</p>
            </header>

            <div className={styles.block}>
                <div className={styles.blockHeader}>
                    <h3 className={styles.blockTitle}>{t.telemetryTitle}</h3>
                    <Switch checked={telemetry} onChange={toggleTelemetry} aria-label={t.telemetryTitle} />
                </div>
                <p className={styles.hint}>{t.telemetryHint}</p>
                <p className={styles.state} data-on={telemetry}>
                    {telemetry ? t.telemetryOn : t.telemetryOff}
                </p>
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t.localTitle}</h3>
                <p className={styles.hint}>{t.localHint}</p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.action}
                        onClick={() => {
                            void clearLocalStorages().then(() => messageApi.success(t.clearStorageDone));
                        }}
                    >
                        {t.clearStorage}
                    </button>
                    <button
                        type="button"
                        className={styles.action}
                        onClick={() => {
                            void clearCachesAndSw().then(() => messageApi.success(t.clearCachesDone));
                        }}
                    >
                        {t.clearCaches}
                    </button>
                    <button
                        type="button"
                        className={`${styles.action} ${styles.actionDanger}`}
                        onClick={() =>
                            confirmDanger(t.hardResetConfirm, async () => {
                                await clearLocalStorages();
                                await clearCachesAndSw();
                                window.location.reload();
                            })
                        }
                    >
                        {t.hardReset}
                    </button>
                </div>
                <p className={styles.hint}>{t.hardResetHint}</p>
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t.accountTitle}</h3>
                <p className={styles.hint}>{t.accountHint}</p>
                {user ? (
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={`${styles.action} ${styles.actionDanger}`}
                            onClick={() =>
                                confirmDanger(t.deleteAccountConfirm, async () => {
                                    const res = await fetch('/api/user/account', {
                                        method: 'DELETE',
                                        credentials: 'same-origin',
                                    });
                                    if (res.ok) {
                                        messageApi.success(t.deleteAccountDone);
                                        await clearLocalStorages();
                                        window.setTimeout(() => window.location.assign('/'), 900);
                                    } else {
                                        messageApi.error(t.deleteAccountError);
                                    }
                                })
                            }
                        >
                            {t.deleteAccount}
                        </button>
                    </div>
                ) : (
                    <p className={styles.state}>{t.notLoggedIn}</p>
                )}
            </div>
        </section>
    );
}
