'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Input, Space, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';
import { TurnstileWidget, turnstileEnabled } from '@/components/feedback/TurnstileWidget';

const { Title, Text, Paragraph } = Typography;

interface Entry {
  id: string;
  name: string;
  message: string;
  country: string | null;
  status?: string;
  createdAt: number;
}

function flag(country: string | null): string {
  if (!country || !/^[A-Z]{2}$/.test(country)) return '';
  const base = 0x1f1e6;
  return String.fromCodePoint(base + country.charCodeAt(0) - 65, base + country.charCodeAt(1) - 65);
}

export function GuestbookClient() {
  const t = useTranslations('Guestbook');
  const [messageApi, contextHolder] = message.useMessage();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guestbook', { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error('load');
      const data = (await res.json()) as { items: Entry[]; isOwner: boolean };
      setEntries(data.items);
      setIsOwner(data.isOwner);
    } catch {
      messageApi.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [messageApi, t]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const n = name.trim();
    const m = body.trim();
    if (!n || !m) {
      messageApi.warning(t('errorEmpty'));
      return;
    }
    if (turnstileEnabled() && !token) {
      messageApi.warning(t('errorCaptcha'));
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: n, message: m, turnstileToken: token }),
      });
      if (!res.ok) throw new Error('post');
      const data = (await res.json()) as { entry: Entry };
      setEntries((prev) => [{ ...data.entry, country: null }, ...prev]);
      setName('');
      setBody('');
      setToken(null);
      messageApi.success(t('thanks'));
    } catch {
      messageApi.error(t('errorGeneric'));
    } finally {
      setSending(false);
    }
  };

  const hide = async (id: string) => {
    try {
      const res = await fetch(`/api/guestbook/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('hide');
      setEntries((prev) => prev.filter((e) => e.id !== id));
      messageApi.success(t('hidden'));
    } catch {
      messageApi.error(t('errorGeneric'));
    }
  };

  return (
    <Space
      direction="vertical"
      size={24}
      style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}
    >
      {contextHolder}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          {t('title')}
        </Title>
        <Text type="secondary">{t('subtitle')}</Text>
      </div>

      <Card size="small" title={t('signTitle')}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            placeholder={t('namePlaceholder')}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
          <Input.TextArea
            placeholder={t('messagePlaceholder')}
            value={body}
            maxLength={500}
            autoSize={{ minRows: 2, maxRows: 5 }}
            showCount
            onChange={(e) => setBody(e.target.value)}
          />
          {turnstileEnabled() ? <TurnstileWidget onToken={setToken} /> : null}
          <Button
            type="primary"
            loading={sending}
            onClick={submit}
            disabled={!name.trim() || !body.trim()}
          >
            {sending ? t('submitting') : t('submit')}
          </Button>
        </Space>
      </Card>

      <div>
        <Title level={4}>{t('entriesTitle')}</Title>
        {loading ? (
          <Text type="secondary">{t('loading')}</Text>
        ) : entries.length === 0 ? (
          <Empty description={t('empty')} />
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {entries.map((e) => (
              <Card key={e.id} size="small" style={e.status === 'hidden' ? { opacity: 0.55 } : undefined}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>
                      {flag(e.country)} {e.name}
                    </Text>
                    <Space size={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(e.createdAt * 1000).toLocaleDateString()}
                      </Text>
                      {isOwner && e.status !== 'hidden' ? (
                        <Button size="small" type="text" danger onClick={() => hide(e.id)}>
                          {t('hide')}
                        </Button>
                      ) : null}
                    </Space>
                  </Space>
                  <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{e.message}</Paragraph>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </div>
    </Space>
  );
}
