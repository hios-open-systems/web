'use client';

import React from 'react';
import { Typography, Tag } from 'antd';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { LinkOutlined } from '@ant-design/icons';
import Image from 'next/image';

const { Text } = Typography;

export interface Tool {
    name: string;
    logo?: string;
    icon?: React.ReactNode;
    description: string;
    category: 'software' | 'hardware';
    usedFor: string;
    projectsUsing: number;
    url: string;
}

interface ToolCardProps {
    tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
    const { mode } = useTheme();

    return (
        <motion.a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
                display: 'block',
                textDecoration: 'none',
                height: '100%',
            }}
        >
            <div
                style={{
                    height: '100%',
                    padding: '24px',
                    background: mode === 'dark' ? '#141414' : '#ffffff',
                    border: mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                }}
            >
                {/* Logo/Icon */}
                <motion.div
                    className="logo-3d-hover"
                    style={{
                        width: '56px',
                        height: '56px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}
                >
                    {tool.logo ? (
                        <Image
                            src={tool.logo}
                            alt={tool.name}
                            width={40}
                            height={40}
                            style={{ objectFit: 'contain' }}
                        />
                    ) : (
                        <span style={{
                            fontSize: '28px',
                            color: mode === 'dark' ? '#666' : '#999',
                        }}>
                            {tool.icon}
                        </span>
                    )}
                </motion.div>

                {/* Name and link icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                }}>
                    <Text strong style={{
                        color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
                        fontSize: '16px',
                    }}>
                        {tool.name}
                    </Text>
                    <LinkOutlined style={{
                        color: mode === 'dark' ? '#444' : '#ccc',
                        fontSize: '12px',
                    }} />
                </div>

                {/* Description */}
                <Text style={{
                    color: mode === 'dark' ? '#808080' : '#666',
                    fontSize: '13px',
                    display: 'block',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                }}>
                    {tool.description}
                </Text>

                {/* Used for */}
                <Text style={{
                    color: mode === 'dark' ? '#555' : '#999',
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '12px',
                }}>
                    {tool.usedFor}
                </Text>

                {/* Projects badge */}
                {tool.projectsUsing > 0 && (
                    <Tag
                        style={{
                            background: mode === 'dark' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
                            border: 'none',
                            color: '#f59e0b',
                            fontSize: '11px',
                            borderRadius: '4px',
                        }}
                    >
                        {tool.projectsUsing} proyecto{tool.projectsUsing > 1 ? 's' : ''}
                    </Tag>
                )}
            </div>
        </motion.a>
    );
}
