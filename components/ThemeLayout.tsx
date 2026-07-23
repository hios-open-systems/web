'use client';

import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { VersionWatcher } from '@/components/common/VersionWatcher';
import { CommandPalette } from '@/components/common/CommandPalette';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';
import { DynamicFavicon } from '@/components/common/DynamicFavicon';
import { UsageEventTracker } from '@/components/common/UsageEventTracker';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { getAntdTheme } from '@/styles/theme';

function ThemedLayout({ children, currentVersion }: { children: React.ReactNode; currentVersion: string }) {
    const { mode, accent } = useTheme();
    const currentTheme = React.useMemo(() => getAntdTheme(mode, accent), [mode, accent]);
    // CSS var, no estado React: el SSR renderiza siempre 'dark' y un fondo inline
    // por-modo produce flash oscuro + hydration mismatch para usuarios en light.
    const bgColor = 'var(--hios-bg)';

    return (
        <ConfigProvider theme={currentTheme}>
            <FeedbackProvider>
                <VersionWatcher currentVersion={currentVersion} />
                <ServiceWorkerRegister />
                <DynamicFavicon />
                <UsageEventTracker />
                <CommandPalette />
                <Layout style={{ minHeight: '100vh', background: bgColor }}>
                    <Header />
                    <Layout.Content>
                        {children}
                    </Layout.Content>
                    <Footer />
                </Layout>
            </FeedbackProvider>
        </ConfigProvider>
    );
}

export function ThemeLayout({ children, currentVersion }: { children: React.ReactNode; currentVersion: string }) {
    return (
        <ThemeProvider>
            <ThemedLayout currentVersion={currentVersion}>{children}</ThemedLayout>
        </ThemeProvider>
    );
}
