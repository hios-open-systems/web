'use client';

import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { VersionWatcher } from '@/components/common/VersionWatcher';
import { CommandPalette } from '@/components/common/CommandPalette';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';
import { UsageEventTracker } from '@/components/common/UsageEventTracker';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { lightTheme, darkTheme } from '@/styles/theme';

function ThemedLayout({ children, currentVersion }: { children: React.ReactNode; currentVersion: string }) {
    const { mode } = useTheme();
    const currentTheme = mode === 'dark' ? darkTheme : lightTheme;
    const bgColor = mode === 'dark' ? '#0d0d0d' : '#ffffff';

    return (
        <ConfigProvider theme={currentTheme}>
            <FeedbackProvider>
                <VersionWatcher currentVersion={currentVersion} />
                <ServiceWorkerRegister />
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
