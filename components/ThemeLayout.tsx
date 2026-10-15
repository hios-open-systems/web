'use client';

import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { ConsoleEasterEgg } from '@/components/common/ConsoleEasterEgg';
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
import { DEFAULT_ACCENT } from '@/lib/themes/config';
import { WorkspaceProvider } from '@/components/workbench/WorkspaceProvider';
import { HandoffNotice } from '@/components/workbench/HandoffNotice';

function ThemedLayout({ children, currentVersion }: { children: React.ReactNode; currentVersion: string }) {
    const { mode, accent, skin } = useTheme();
    // Match the extracted SSR tokens first, then update the CSS-in-JS cache
    // with the saved theme. Otherwise a direct light-mode visit can keep dark controls.
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    const currentTheme = React.useMemo(
        () => getAntdTheme(mounted ? mode : 'dark', mounted ? accent : DEFAULT_ACCENT, mounted ? skin : 'datasheet'),
        [mounted, mode, accent, skin],
    );
    // CSS var, no estado React: el SSR renderiza siempre 'dark' y un fondo inline
    // por-modo produce flash oscuro + hydration mismatch para usuarios en light.
    const bgColor = 'var(--hios-bg)';

    return (
        <ConfigProvider theme={currentTheme}>
            <FeedbackProvider>
              <WorkspaceProvider>
                <ConsoleEasterEgg />
                <VersionWatcher currentVersion={currentVersion} />
                <ServiceWorkerRegister />
                <DynamicFavicon />
                <UsageEventTracker />
                <CommandPalette />
                <Layout style={{ minHeight: '100vh', background: bgColor }}>
                    <Header />
                    <Layout.Content>
                        <HandoffNotice />
                        {children}
                    </Layout.Content>
                    <Footer />
                </Layout>
              </WorkspaceProvider>
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
