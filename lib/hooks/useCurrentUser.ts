'use client';

import { useEffect, useState } from 'react';

export interface CurrentUser {
    id: string;
    login: string;
    name: string | null;
    avatar_url: string | null;
    /** true solo para el dueño del sitio (gating de /admin). */
    isOwner?: boolean;
}

interface MeResponse {
    user: CurrentUser | null;
}

export function useCurrentUser() {
    const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then((res) => (res.ok ? res.json() : { user: null }))
            .then((data: MeResponse) => {
                if (!cancelled) setUser(data.user);
            })
            .catch(() => {
                if (!cancelled) setUser(null);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return {
        user,
        isLoading: user === undefined,
    };
}