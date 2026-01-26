'use client';

import React from 'react';
import { Row, Col, Typography, Card } from 'antd';
import { ToolOutlined, CodeOutlined, ShareAltOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export function PhilosophySection() {
    const principles = [
        {
            icon: <ToolOutlined style={{ fontSize: '32px', color: '#0066cc' }} />,
            title: 'Professional Hardware',
            description: 'Circuit design, PCB layout, and mechanical engineering meeting industrial standards.'
        },
        {
            icon: <CodeOutlined style={{ fontSize: '32px', color: '#0066cc' }} />,
            title: 'Robust Firmware',
            description: 'Reliable, efficient, and maintainable embedded software built on ensuring stability.'
        },
        {
            icon: <ShareAltOutlined style={{ fontSize: '32px', color: '#0066cc' }} />,
            title: 'Open Knowledge',
            description: 'Everything is documented and shared. The goal is to learn and help others learn.'
        }
    ];

    return (
        <section style={{ padding: '100px 24px', background: '#fff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <Title level={2}>Core Philosophy</Title>
                    <Paragraph style={{ maxWidth: 700, margin: '0 auto', fontSize: '18px', color: '#666' }}>
                        HIOS is not just a portfolio—it&apos;s a commitment to engineering excellence and open collaboration.
                    </Paragraph>
                </div>

                <Row gutter={[32, 32]}>
                    {principles.map((item, index) => (
                        <Col xs={24} md={8} key={index}>
                            <Card
                                bordered={false}
                                hoverable
                                style={{
                                    height: '100%',
                                    textAlign: 'center',
                                    background: '#f9f9f9'
                                }}
                            >
                                <div style={{ marginBottom: '24px' }}>
                                    {item.icon}
                                </div>
                                <Title level={4}>{item.title}</Title>
                                <Paragraph type="secondary">
                                    {item.description}
                                </Paragraph>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}
