'use client';

import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { lightTheme, darkTheme } from '@/styles/theme';

function ThemedLayout({ children }: { children: React.ReactNode }) {
    const { mode } = useTheme();
    const currentTheme = mode === 'dark' ? darkTheme : lightTheme;
    const bgColor = mode === 'dark' ? '#0d0d0d' : '#ffffff';

    return (
        <ConfigProvider theme={currentTheme}>
            <FeedbackProvider>
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

export function ThemeLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ThemedLayout>{children}</ThemedLayout>
        </ThemeProvider>
    );
}
