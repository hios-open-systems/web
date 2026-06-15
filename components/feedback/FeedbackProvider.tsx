'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { installCapture } from '@/lib/feedback/capture';
import {
    appendEntry,
    clearAll,
    countUnread,
    deleteEntry,
    markAllRead,
    readEntries,
    serializeEntry,
    type AppendDraft,
} from '@/lib/feedback/storage';
import type { FeedbackEntry, FeedbackKind } from '@/lib/feedback/types';

interface FeedbackContextValue {
    entries: FeedbackEntry[];
    unreadCount: number;
    addManual: (kind: FeedbackKind, title: string, body: string, rating?: number) => FeedbackEntry;
    remove: (id: string) => void;
    clear: () => void;
    markRead: () => void;
    serialize: (entry: FeedbackEntry) => string;
    refresh: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const SYNC_EVENT = 'hios-feedback-changed';

function dispatchSync() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    }
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const t = useTranslations('Feedback');
    const { user } = useCurrentUser();
    const [entries, setEntries] = useState<FeedbackEntry[]>([]);
    const [messageApi, contextHolder] = message.useMessage();

    const refresh = useCallback(() => {
        setEntries(readEntries());
    }, []);

    // Mantenemos t y messageApi en refs para que el efecto de install/uninstall
    // corra exactamente una vez. Si dependiera de t/messageApi, identidades inestables
    // de esos hooks bajo carga pueden hacer que se reinstale en loop, dejando una
    // ventana sin listener.
    const tRef = React.useRef(t);
    const messageApiRef = React.useRef(messageApi);
    React.useEffect(() => {
        tRef.current = t;
    }, [t]);
    React.useEffect(() => {
        messageApiRef.current = messageApi;
    }, [messageApi]);

    useEffect(() => {
        refresh();
        const cleanup = installCapture({
            getContext: () => ({
                authState: user ? 'authenticated' : 'anonymous',
                userId: user?.id,
            }),
            onCapture: (entry) => {
                refresh();
                dispatchSync();
                messageApiRef.current.warning({
                    content: tRef.current('toastErrorCaptured', { title: entry.title }),
                    duration: 4,
                });
            },
        });

        const onSync = () => refresh();
        const onStorage = (event: StorageEvent) => {
            if (event.key === 'hios-feedback-entries') refresh();
        };
        window.addEventListener(SYNC_EVENT, onSync);
        window.addEventListener('storage', onStorage);

        return () => {
            cleanup();
            window.removeEventListener(SYNC_EVENT, onSync);
            window.removeEventListener('storage', onStorage);
        };
    }, [refresh, user]);

    const addManual = useCallback<FeedbackContextValue['addManual']>(
        (kind, title, body, rating) => {
            const draft: AppendDraft = {
                kind,
                source: 'manual',
                title,
                body,
                rating,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                authState: user ? 'authenticated' : 'anonymous',
                userId: user?.id,
            };
            const entry = appendEntry(draft);
            refresh();
            dispatchSync();
            return entry;
        },
        [refresh, user],
    );

    const remove = useCallback(
        (id: string) => {
            deleteEntry(id);
            refresh();
            dispatchSync();
        },
        [refresh],
    );

    const clear = useCallback(() => {
        clearAll();
        refresh();
        dispatchSync();
    }, [refresh]);

    const markRead = useCallback(() => {
        markAllRead();
        refresh();
        dispatchSync();
    }, [refresh]);

    const value = useMemo<FeedbackContextValue>(
        () => ({
            entries,
            unreadCount: countUnread(entries),
            addManual,
            remove,
            clear,
            markRead,
            serialize: serializeEntry,
            refresh,
        }),
        [entries, addManual, remove, clear, markRead, refresh],
    );

    return (
        <FeedbackContext.Provider value={value}>
            {contextHolder}
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback(): FeedbackContextValue {
    const ctx = useContext(FeedbackContext);
    if (!ctx) {
        throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
    }
    return ctx;
}
