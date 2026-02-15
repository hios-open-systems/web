'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, InputNumber, Row, Space, Typography, message } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const { Title, Text } = Typography;

export function RclCalculator() {
  const t = useTranslations('CalculatorsRCL');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [r, setR] = useState(10);
  const [lMilliH, setLMilliH] = useState(10);
  const [cMicroF, setCMicroF] = useState(1);
  const [freq, setFreq] = useState(1000);

  useEffect(() => {
    if (hydratedFromUrl.current) return;

    const parseNumber = (key: string, fallback: number) => {
      const raw = searchParams.get(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    setR(parseNumber('r', 10));
    setLMilliH(parseNumber('l', 10));
    setCMicroF(parseNumber('c', 1));
    setFreq(parseNumber('f', 1000));

    hydratedFromUrl.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('r', String(r));
    params.set('l', String(lMilliH));
    params.set('c', String(cMicroF));
    params.set('f', String(freq));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [searchParams, router, pathname, r, lMilliH, cMicroF, freq]);

  const values = useMemo(() => {
    const l = lMilliH / 1000;
    const c = cMicroF / 1_000_000;

    if (l <= 0 || c <= 0 || freq <= 0) {
      return { xl: 0, xc: 0, z: 0, f0: 0, q: 0 };
    }

    const w = 2 * Math.PI * freq;
    const xl = w * l;
    const xc = 1 / (w * c);
    const z = Math.sqrt(r * r + (xl - xc) * (xl - xc));
    const f0 = 1 / (2 * Math.PI * Math.sqrt(l * c));
    const q = r > 0 ? (1 / r) * Math.sqrt(l / c) : 0;

    return { xl, xc, z, f0, q };
  }, [r, lMilliH, cMicroF, freq]);

  const copyShareLink = async () => {
    try {
      const query = searchParams.toString();
      const shareUrl = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success(t('share_ok'));
    } catch {
      messageApi.error(t('share_error'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2} style={{ margin: 0 }}>{t('title')}</Title>
      <Text type="secondary">{t('subtitle')}</Text>
      <Space>
        <Button onClick={copyShareLink}>{t('copy_link')}</Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t('inputs')}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Text>{t('r_ohm')}</Text>
              <InputNumber value={r} onChange={(v) => setR(Number(v || 0))} min={0} style={{ width: '100%' }} />

              <Text>{t('l_mh')}</Text>
              <InputNumber value={lMilliH} onChange={(v) => setLMilliH(Number(v || 0))} min={0.001} step={0.1} style={{ width: '100%' }} />

              <Text>{t('c_uf')}</Text>
              <InputNumber value={cMicroF} onChange={(v) => setCMicroF(Number(v || 0))} min={0.001} step={0.1} style={{ width: '100%' }} />

              <Text>{t('freq_hz')}</Text>
              <InputNumber value={freq} onChange={(v) => setFreq(Number(v || 0))} min={1} style={{ width: '100%' }} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('results')}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong>{t('xl')}: {values.xl.toFixed(2)} Ω</Text>
              <Text strong>{t('xc')}: {values.xc.toFixed(2)} Ω</Text>
              <Text strong>{t('z')}: {values.z.toFixed(2)} Ω</Text>
              <Text strong>{t('f0')}: {values.f0.toFixed(2)} Hz</Text>
              <Text strong>{t('q')}: {values.q.toFixed(3)}</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Text type="secondary">{t('notes')}</Text>
      </Card>
    </Space>
  );
}
