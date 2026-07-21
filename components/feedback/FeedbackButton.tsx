'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Button, Input, Modal, Rate, Segmented } from 'antd';
import { message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { submitFeedback } from '@/lib/feedback/submit';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { TurnstileWidget, turnstileEnabled } from '@/components/feedback/TurnstileWidget';

type WidgetKind = 'bug' | 'idea' | 'note';

const KIND_VALUES: WidgetKind[] = ['bug', 'idea', 'note'];

function isWidgetKind(value: unknown): value is WidgetKind {
    return typeof value === 'string' && (KIND_VALUES as string[]).includes(value);
}

/**
 * Deduce el toolSlug del pathname. Para `/<locale>/workbench/<slug>` el slug es
 * el tercer segmento. Cualquier otra ruta no aporta slug.
 */
function deriveToolSlug(pathname: string): string | undefined {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[1] === 'workbench' && segments[2]) {
        return segments[2];
    }
    return undefined;
}

export function FeedbackButton({ toolSlug }: { toolSlug?: string }) {
    const t = useTranslations('Feedback');
    const pathname = usePathname();
    const { addManual } = useFeedback();
    const [messageApi, contextHolder] = message.useMessage();

    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<WidgetKind>('note');
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [email, setEmail] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const resolvedSlug = toolSlug ?? deriveToolSlug(pathname ?? '');

    const reset = () => {
        setKind('note');
        setRating(0);
        setText('');
        setEmail('');
        setTurnstileToken(null);
    };

    const handleCancel = () => {
        setOpen(false);
    };

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed) {
            messageApi.error(t('widget.emptyError'));
            return;
        }

        if (turnstileEnabled() && !turnstileToken) {
            messageApi.error(t.has('widget.captchaError') ? t('widget.captchaError') : 'Completá la verificación');
            return;
        }

        const effectiveRating = rating > 0 ? rating : undefined;
        const kindLabelKey = `widget.kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}` as const;

        setSending(true);
        try {
            const result = await submitFeedback({
                kind,
                rating: effectiveRating,
                message: trimmed,
                email: email || undefined,
                toolSlug: resolvedSlug,
                turnstileToken: turnstileToken ?? undefined,
            });

            addManual(kind, trimmed.slice(0, 60) || t(kindLabelKey), trimmed, effectiveRating);

            if (result.ok) {
                messageApi.success(t('widget.thanks'));
            } else {
                messageApi.info(t('widget.thanksLocal'));
            }

            setOpen(false);
            reset();
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Button size="small" icon={<MessageOutlined />} onClick={() => setOpen(true)}>
                {t('widget.button')}
            </Button>
            <Modal
                title={t('widget.title')}
                open={open}
                onCancel={handleCancel}
                destroyOnClose
                footer={[
                    <Button key="cancel" onClick={handleCancel} disabled={sending}>
                        {t('widget.cancel')}
                    </Button>,
                    <Button key="send" type="primary" loading={sending} onClick={handleSend}>
                        {t('widget.send')}
                    </Button>,
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Segmented<WidgetKind>
                        value={kind}
                        onChange={(value) => {
                            if (isWidgetKind(value)) setKind(value);
                        }}
                        options={[
                            { label: t('widget.kindBug'), value: 'bug' },
                            { label: t('widget.kindIdea'), value: 'idea' },
                            { label: t('widget.kindNote'), value: 'note' },
                        ]}
                    />

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>{t('widget.ratingLabel')}</span>
                        <Rate allowClear value={rating} onChange={setRating} />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>{t('widget.messageLabel')}</span>
                        <Input.TextArea
                            autoSize={{ minRows: 3, maxRows: 8 }}
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            placeholder={t('widget.messagePlaceholder')}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>{t('widget.emailLabel')}</span>
                        <Input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={t('widget.emailPlaceholder')}
                        />
                        <span style={{ fontSize: 12, opacity: 0.65 }}>{t('widget.emailHint')}</span>
                    </label>

                    <TurnstileWidget onToken={setTurnstileToken} />
                </div>
            </Modal>
        </>
    );
}
