'use client';

import React from 'react';
import { Row, Col, Typography, Tag, Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export function ProductShowcase() {
    return (
        <section style={{ padding: '100px 24px', background: '#f0f5ff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row align="middle" gutter={[64, 64]}>
                    <Col xs={24} md={12}>
                        {/* Placeholder for Product Image - User should replace with actual image */}
                        <div style={{
                            width: '100%',
                            height: '400px',
                            background: '#fff',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                padding: '8px 16px',
                                borderBottomRightRadius: '16px',
                                fontWeight: 'bold'
                            }}>
                                Featured Project
                            </div>
                            <span style={{ color: '#ccc' }}>Product Image Placehoder</span>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <Tag color="blue" style={{ marginBottom: '16px' }}>PROTOTYPE v1</Tag>
                        <Title level={2}>WFBTDACAMP</Title>
                        <Title level={4} type="secondary" style={{ marginTop: 0 }}>
                            Wireless Bluetooth DAC Amplifier
                        </Title>
                        <Paragraph style={{ fontSize: '16px' }}>
                            A high-fidelity portable audio receiver combining a 24-bit DAC, powerful headphone amplifier, and intelligent battery management system. Designed for audiophiles who demand freedom without compromising quality.
                        </Paragraph>

                        <div style={{ margin: '24px 0' }}>
                            <Tag>ESP32</Tag>
                            <Tag>PCM5102</Tag>
                            <Tag>NE5532</Tag>
                            <Tag>3D Printed</Tag>
                        </div>

                        <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                            View Technical Specs
                        </Button>
                    </Col>
                </Row>
            </div>
        </section>
    );
}
