import type { Metadata } from 'next';
import { Card, Space, Tag, Typography } from 'antd';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getDb } from '@/lib/db';
import { getPublicSnippetById } from '@/lib/snippets';

const { Paragraph, Text, Title } = Typography;

interface PageProps {
    params: Promise<{ locale: string; id: string }>;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

    try {
        const db = getDb();
        const snippet = await getPublicSnippetById(db, id);
        if (!snippet) {
            return { title: 'Snippet not found | HIOS Workbench' };
        }
        return {
            title: `${snippet.title} | HIOS Snippet`,
            description: snippet.body.slice(0, 140),
        };
    } catch {
        return { title: 'Public snippet | HIOS Workbench' };
    }
}

export default async function PublicSnippetPage({ params }: PageProps) {
    const { locale, id } = await params;
    setRequestLocale(locale);

    const db = getDb();
    const snippet = await getPublicSnippetById(db, id);
    if (!snippet) {
        notFound();
    }

    return (
        <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 56px' }}>
            <Card style={{ borderRadius: 16 }}>
                <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    <div>
                        <Tag color="green">Public snippet</Tag>
                        <Title level={1} style={{ margin: '10px 0 0' }}>{snippet.title}</Title>
                    </div>

                    {snippet.tags.length > 0 ? (
                        <Space size={[8, 8]} wrap>
                            {snippet.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                        </Space>
                    ) : null}

                    <Paragraph style={{ margin: 0 }}>
                        Shared from HIOS Workbench. Updated <Text strong>{new Date(snippet.updatedAt).toLocaleString()}</Text>.
                    </Paragraph>

                    <pre style={{
                        margin: 0,
                        padding: 16,
                        borderRadius: 12,
                        overflowX: 'auto',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        fontSize: 12,
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                    }}>
                        {snippet.body}
                    </pre>
                </Space>
            </Card>
        </main>
    );
}