'use client';

import React, { useState } from 'react';
import { Row, Col, Typography, Card, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslations } from 'next-intl';
import {
    RocketOutlined,
    CodeOutlined,
    SettingOutlined,
    WindowsOutlined,
    AppleOutlined,
    LinuxOutlined,
    CopyOutlined,
    CheckOutlined,
    ThunderboltOutlined,
    BugOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface Step {
    titleKey: string;
    descriptionKey?: string;
    command?: string;
    note?: string;
}

interface Tutorial {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: React.ReactNode;
    color: string;
    platform?: 'windows' | 'macos' | 'linux' | 'all';
    steps: Step[];
}

const tutorials: Tutorial[] = [
    {
        id: 'vscode-platformio',
        titleKey: 'vscode_platformio_title',
        descriptionKey: 'vscode_platformio_desc',
        icon: <RocketOutlined />,
        color: '#4096ff',
        platform: 'all',
        steps: [
            { titleKey: 'step_install_vscode', command: 'https://code.visualstudio.com/download' },
            { titleKey: 'step_install_pio', descriptionKey: 'step_install_pio_desc' },
            { titleKey: 'step_clone_repo', command: 'git clone https://github.com/hiparedez/btdac.git' },
            { titleKey: 'step_open_folder', descriptionKey: 'step_open_folder_desc' },
            { titleKey: 'step_wait_init', descriptionKey: 'step_wait_init_desc' },
        ],
    },
    {
        id: 'pio-commands',
        titleKey: 'pio_commands_title',
        descriptionKey: 'pio_commands_desc',
        icon: <ThunderboltOutlined />,
        color: '#f59e0b',
        platform: 'all',
        steps: [
            { titleKey: 'cmd_build', command: 'pio run', descriptionKey: 'cmd_build_desc' },
            { titleKey: 'cmd_upload', command: 'pio run -t upload', descriptionKey: 'cmd_upload_desc' },
            { titleKey: 'cmd_monitor', command: 'pio device monitor', descriptionKey: 'cmd_monitor_desc' },
            { titleKey: 'cmd_clean', command: 'pio run -t clean', descriptionKey: 'cmd_clean_desc' },
            { titleKey: 'cmd_all', command: 'pio run -t upload && pio device monitor', descriptionKey: 'cmd_all_desc' },
        ],
    },
    {
        id: 'wsl-usb',
        titleKey: 'wsl_usb_title',
        descriptionKey: 'wsl_usb_desc',
        icon: <WindowsOutlined />,
        color: '#10b981',
        platform: 'windows',
        steps: [
            { titleKey: 'wsl_install_usbipd', command: 'winget install usbipd', descriptionKey: 'wsl_install_usbipd_desc' },
            { titleKey: 'wsl_list_devices', command: 'usbipd list', descriptionKey: 'wsl_list_devices_desc' },
            { titleKey: 'wsl_bind', command: 'usbipd bind --busid <BUSID>', descriptionKey: 'wsl_bind_desc' },
            { titleKey: 'wsl_attach', command: 'usbipd attach --wsl --busid <BUSID>', descriptionKey: 'wsl_attach_desc' },
            { titleKey: 'wsl_verify', command: 'ls /dev/ttyUSB*', descriptionKey: 'wsl_verify_desc' },
        ],
    },
    {
        id: 'troubleshoot',
        titleKey: 'troubleshoot_title',
        descriptionKey: 'troubleshoot_desc',
        icon: <BugOutlined />,
        color: '#ef4444',
        platform: 'all',
        steps: [
            { titleKey: 'ts_port_busy', command: 'sudo chmod 666 /dev/ttyUSB0', descriptionKey: 'ts_port_busy_desc' },
            { titleKey: 'ts_no_port', descriptionKey: 'ts_no_port_desc' },
            { titleKey: 'ts_upload_fail', command: 'pio run -t upload --upload-port /dev/ttyUSB0', descriptionKey: 'ts_upload_fail_desc' },
            { titleKey: 'ts_libs', command: 'pio lib install', descriptionKey: 'ts_libs_desc' },
        ],
    },
];

export function TutorialsSection() {
    const { mode } = useTheme();
    const t = useTranslations('Tutorials');
    const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    const copyToClipboard = async (command: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(command);
            setCopiedCommand(command);
            message.success(t('copied') || 'Copied!');
            setTimeout(() => setCopiedCommand(null), 2000);
        } catch {
            message.error('Failed to copy');
        }
    };

    const getPlatformIcon = (platform?: string) => {
        switch (platform) {
            case 'windows':
                return <WindowsOutlined style={{ fontSize: '12px', marginRight: '4px' }} />;
            case 'macos':
                return <AppleOutlined style={{ fontSize: '12px', marginRight: '4px' }} />;
            case 'linux':
                return <LinuxOutlined style={{ fontSize: '12px', marginRight: '4px' }} />;
            default:
                return null;
        }
    };

    return (
        <section style={{
            padding: '80px 24px',
            background: mode === 'dark' ? '#0d0d0d' : '#ffffff',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '48px' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                        borderRadius: '20px',
                        marginBottom: '16px',
                    }}>
                        <CodeOutlined style={{ color: '#4096ff', fontSize: '14px' }} />
                        <Text style={{
                            color: mode === 'dark' ? '#888' : '#666',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                        }}>
                            {t('badge') || 'Quick Start'}
                        </Text>
                    </div>
                    <Title level={2} style={{
                        color: mode === 'dark' ? '#ffffff' : '#0d0d0d',
                        marginBottom: '12px',
                    }}>
                        {t('title') || 'Tutorials'}
                    </Title>
                    <Paragraph style={{
                        color: mode === 'dark' ? '#666' : '#999',
                        fontSize: '15px',
                    }}>
                        {t('subtitle') || 'Step-by-step guides to get you started'}
                    </Paragraph>
                </motion.div>

                <Row gutter={[20, 20]}>
                    {tutorials.map((tutorial, index) => (
                        <Col xs={24} md={12} key={tutorial.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Card
                                    hoverable
                                    onClick={() => setExpandedTutorial(
                                        expandedTutorial === tutorial.id ? null : tutorial.id
                                    )}
                                    style={{
                                        background: mode === 'dark' ? '#141414' : '#fafafa',
                                        border: mode === 'dark'
                                            ? `1px solid ${expandedTutorial === tutorial.id ? tutorial.color + '40' : '#262626'}`
                                            : `1px solid ${expandedTutorial === tutorial.id ? tutorial.color + '40' : '#e8e8e8'}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    styles={{
                                        body: { padding: '20px' }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px',
                                    }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '10px',
                                            background: `${tutorial.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            color: tutorial.color,
                                            flexShrink: 0,
                                        }}>
                                            {tutorial.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <Text strong style={{
                                                    color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
                                                    fontSize: '16px',
                                                }}>
                                                    {t(tutorial.titleKey) || tutorial.titleKey}
                                                </Text>
                                                {tutorial.platform && tutorial.platform !== 'all' && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        background: mode === 'dark' ? '#262626' : '#e8e8e8',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        color: mode === 'dark' ? '#888' : '#666',
                                                    }}>
                                                        {getPlatformIcon(tutorial.platform)}
                                                        {tutorial.platform.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <Text style={{
                                                color: mode === 'dark' ? '#666' : '#999',
                                                fontSize: '13px',
                                            }}>
                                                {t(tutorial.descriptionKey) || tutorial.descriptionKey}
                                            </Text>
                                            <div style={{
                                                marginTop: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                <SettingOutlined style={{
                                                    color: mode === 'dark' ? '#444' : '#ccc',
                                                    fontSize: '11px',
                                                }} />
                                                <Text style={{
                                                    color: mode === 'dark' ? '#444' : '#bbb',
                                                    fontSize: '12px',
                                                }}>
                                                    {tutorial.steps.length} {t('steps') || 'steps'}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedTutorial === tutorial.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{
                                                    marginTop: '20px',
                                                    paddingTop: '16px',
                                                    borderTop: mode === 'dark'
                                                        ? '1px solid #262626'
                                                        : '1px solid #e8e8e8',
                                                }}>
                                                    {tutorial.steps.map((step, stepIdx) => (
                                                        <motion.div
                                                            key={stepIdx}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: stepIdx * 0.05 }}
                                                            style={{
                                                                marginBottom: stepIdx < tutorial.steps.length - 1 ? '16px' : 0,
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                gap: '12px',
                                                            }}>
                                                                <div style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '50%',
                                                                    background: `${tutorial.color}20`,
                                                                    color: tutorial.color,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    flexShrink: 0,
                                                                }}>
                                                                    {stepIdx + 1}
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <Text style={{
                                                                        color: mode === 'dark' ? '#b3b3b3' : '#333',
                                                                        fontSize: '14px',
                                                                        display: 'block',
                                                                        marginBottom: step.command ? '8px' : 0,
                                                                    }}>
                                                                        {t(step.titleKey) || step.titleKey}
                                                                    </Text>
                                                                    {step.descriptionKey && (
                                                                        <Text style={{
                                                                            color: mode === 'dark' ? '#555' : '#888',
                                                                            fontSize: '12px',
                                                                            display: 'block',
                                                                            marginBottom: step.command ? '8px' : 0,
                                                                        }}>
                                                                            {t(step.descriptionKey) || step.descriptionKey}
                                                                        </Text>
                                                                    )}
                                                                    {step.command && !step.command.startsWith('http') && (
                                                                        <div
                                                                            onClick={(e) => copyToClipboard(step.command!, e)}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                padding: '10px 14px',
                                                                                background: mode === 'dark' ? '#0a0a0a' : '#1a1a1a',
                                                                                borderRadius: '8px',
                                                                                fontFamily: 'monospace',
                                                                                fontSize: '13px',
                                                                                color: '#10b981',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease',
                                                                            }}
                                                                        >
                                                                            <code>{step.command}</code>
                                                                            {copiedCommand === step.command ? (
                                                                                <CheckOutlined style={{ color: '#10b981' }} />
                                                                            ) : (
                                                                                <CopyOutlined style={{ color: '#666' }} />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}
