import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { FeedbackInbox } from '@/components/feedback/FeedbackInbox';

export const metadata: Metadata = {
    title: 'Feedback | HIOS Workbench',
    description: 'Errores auto-capturados y entradas manuales (bug, idea, nota). Local-first.',
};

export const runtime = 'edge';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function WorkbenchFeedbackPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 56px' }}>
            <FeedbackInbox />
        </main>
    );
}
