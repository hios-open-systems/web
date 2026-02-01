'use client';

import { useEffect } from 'react';
import { Button, Select, Space, Typography } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text } = Typography;

interface PrintViewProps {
    content: string;
    title: string;
    projectName: string;
    slug: string;
    currentDoc: string;
    availableDocs: string[];
}

export default function PrintView({
    content,
    title,
    projectName,
    slug,
    currentDoc,
    availableDocs,
}: PrintViewProps) {
    const router = useRouter();

    const handlePrint = () => {
        window.print();
    };

    const handleDocChange = (value: string) => {
        router.push(`/print/${slug}/${value}`);
    };

    useEffect(() => {
        // Add print styles dynamically
        const style = document.createElement('style');
        style.id = 'print-styles';
        style.textContent = `
            @media print {
                .no-print {
                    display: none !important;
                }
                body {
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .print-content {
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 15mm !important;
                    font-size: 11pt !important;
                    line-height: 1.4 !important;
                }
                .print-content pre {
                    white-space: pre-wrap !important;
                    word-wrap: break-word !important;
                    background: #f5f5f5 !important;
                    border: 1px solid #ddd !important;
                    padding: 8px !important;
                    font-size: 9pt !important;
                    page-break-inside: avoid !important;
                }
                .print-content table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                    font-size: 10pt !important;
                }
                .print-content th,
                .print-content td {
                    border: 1px solid #333 !important;
                    padding: 4px 8px !important;
                }
                .print-content th {
                    background: #eee !important;
                }
                .print-content h1 { font-size: 18pt !important; margin-top: 0 !important; }
                .print-content h2 { font-size: 14pt !important; page-break-after: avoid !important; }
                .print-content h3 { font-size: 12pt !important; page-break-after: avoid !important; }
                .print-header {
                    border-bottom: 2px solid #333 !important;
                    padding-bottom: 8px !important;
                    margin-bottom: 16px !important;
                }
                .print-footer {
                    position: fixed !important;
                    bottom: 10mm !important;
                    left: 15mm !important;
                    right: 15mm !important;
                    font-size: 9pt !important;
                    color: #666 !important;
                    border-top: 1px solid #ccc !important;
                    padding-top: 4px !important;
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            const existingStyle = document.getElementById('print-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Toolbar - hidden when printing */}
            <div
                className="no-print"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    background: '#1a1a1a',
                    padding: '12px 24px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <Space wrap>
                    <Link href={`/projects/${slug}`}>
                        <Button icon={<ArrowLeftOutlined />}>
                            Volver
                        </Button>
                    </Link>
                    <Select
                        value={currentDoc}
                        onChange={handleDocChange}
                        style={{ width: 180 }}
                        options={availableDocs.map(doc => ({
                            value: doc,
                            label: doc.replace(/_/g, ' '),
                        }))}
                    />
                </Space>
                <Space wrap>
                    <a href={`/downloads/${slug}/${currentDoc}.md`} download>
                        <Button icon={<DownloadOutlined />}>
                            Descargar
                        </Button>
                    </a>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                    >
                        Imprimir
                    </Button>
                </Space>
            </div>

            {/* Print content */}
            <div
                className="print-content"
                style={{
                    maxWidth: 900,
                    margin: '0 auto',
                    padding: '32px 48px',
                    background: 'white',
                    minHeight: 'calc(100vh - 60px)',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header */}
                <div className="print-header" style={{ marginBottom: 24 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        HIOS - {projectName}
                    </Text>
                    <Title level={2} style={{ margin: '8px 0 0 0' }}>
                        {title}
                    </Title>
                </div>

                {/* Markdown content */}
                <div
                    style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                    }}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ children }) => (
                                <h1 style={{ fontSize: 24, marginTop: 32, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 style={{ fontSize: 20, marginTop: 28, marginBottom: 12, color: '#1a1a1a' }}>
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 style={{ fontSize: 16, marginTop: 20, marginBottom: 8, color: '#333' }}>
                                    {children}
                                </h3>
                            ),
                            table: ({ children }) => (
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        margin: '16px 0',
                                        fontSize: 13,
                                    }}
                                >
                                    {children}
                                </table>
                            ),
                            th: ({ children }) => (
                                <th
                                    style={{
                                        border: '1px solid #ddd',
                                        padding: '8px 12px',
                                        background: '#f5f5f5',
                                        fontWeight: 600,
                                        textAlign: 'left',
                                    }}
                                >
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td
                                    style={{
                                        border: '1px solid #ddd',
                                        padding: '8px 12px',
                                    }}
                                >
                                    {children}
                                </td>
                            ),
                            pre: ({ children }) => (
                                <pre
                                    style={{
                                        background: '#f8f8f8',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 4,
                                        padding: 16,
                                        overflow: 'auto',
                                        fontSize: 12,
                                        fontFamily: 'monospace',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {children}
                                </pre>
                            ),
                            code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                    <code
                                        style={{
                                            background: '#f0f0f0',
                                            padding: '2px 6px',
                                            borderRadius: 3,
                                            fontSize: '0.9em',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {children}
                                    </code>
                                ) : (
                                    <code style={{ fontFamily: 'monospace' }}>
                                        {children}
                                    </code>
                                );
                            },
                            hr: () => (
                                <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '24px 0' }} />
                            ),
                            ul: ({ children }) => (
                                <ul style={{ paddingLeft: 24, margin: '12px 0' }}>
                                    {children}
                                </ul>
                            ),
                            ol: ({ children }) => (
                                <ol style={{ paddingLeft: 24, margin: '12px 0' }}>
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li style={{ marginBottom: 4 }}>
                                    {children}
                                </li>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote
                                    style={{
                                        borderLeft: '4px solid #ddd',
                                        margin: '16px 0',
                                        paddingLeft: 16,
                                        color: '#666',
                                    }}
                                >
                                    {children}
                                </blockquote>
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>

                {/* Footer for print */}
                <div
                    className="print-footer"
                    style={{ display: 'none' }}
                >
                    HIOS - {projectName} | {title} | hios.dev
                </div>
            </div>
        </div>
    );
}
