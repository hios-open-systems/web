'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, InputNumber, Segmented, Space, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { type IdType, generateIds, isIdType } from '@/lib/workbench/ids';
import { ToolHeader } from './ToolHeader';
import { UrlPresets } from '@/components/common/UrlPresets';
import styles from './workbench.module.css';

const { Text } = Typography;

export function UuidUlidTool() {
  const t = useTranslations('Workbench.uuidUlid');
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [type, setType] = useState<IdType>('uuid');
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>([]);

  const regenerate = (nextType = type, nextCount = count) => {
    setValues(generateIds(nextType, nextCount));
  };

  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const ty = searchParams.get('type');
    const c = Number(searchParams.get('count'));
    const initType: IdType = ty && isIdType(ty) ? ty : 'uuid';
    const initCount = Number.isFinite(c) && c >= 1 ? Math.min(100, Math.floor(c)) : 5;
    setType(initType);
    setCount(initCount);
    setValues(generateIds(initType, initCount));
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    params.set('count', String(count));
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [type, count, pathname, router, searchParams]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
        '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
        '--wb-code-text': 'var(--hios-text)',
      }) as React.CSSProperties,
    [mode],
  );

  const copy = async (value: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(value);
      messageApi.success(ok);
    } catch {
      messageApi.error(t('copyError'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        guideId="uuidUlid"
        actions={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => regenerate()}>{t('regenerate')}</Button>
            {values.length > 0 ? (
              <Button icon={<CopyOutlined />} onClick={() => copy(values.join('\n'), t('allCopied'))}>
                {t('copyAll')}
              </Button>
            ) : null}
            <UrlPresets storageKey="uuid-ulid" />
          </Space>
        }
      />
      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space wrap size={16}>
          <Segmented
            value={type}
            onChange={(v) => {
              setType(v as IdType);
              regenerate(v as IdType, count);
            }}
            options={[
              { label: t('typeUuid'), value: 'uuid' },
              { label: t('typeUlid'), value: 'ulid' },
            ]}
          />
          <Space size={8}>
            <Text className={styles.metricLabel}>{t('countLabel')}</Text>
            <InputNumber
              min={1}
              max={100}
              value={count}
              onChange={(v) => {
                const c = v ?? 1;
                setCount(c);
                regenerate(type, c);
              }}
            />
          </Space>
        </Space>
      </Card>
      <Card title={t('resultLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        {values.length > 0 ? (
          <div className={styles.generatedList}>
            {values.map((value) => (
              <div key={value} className={styles.generatedRow}>
                <Text className={styles.generatedValue}>{value}</Text>
                <Button type="text" icon={<CopyOutlined />} onClick={() => copy(value, t('copied'))} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyPanel}>
            <Text>{t('empty')}</Text>
          </div>
        )}
      </Card>
    </Space>
  );
}
