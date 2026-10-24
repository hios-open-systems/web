'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Typography } from 'antd';

// Only load Cloudflare after explicit consent. Production requires a site key.
const SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function turnstileEnabled(): boolean {
  return Boolean(SITEKEY);
}

export function TurnstileWidget({ onToken, action, requestId }: { onToken: (token: string | null) => void; action: 'feedback' | 'guestbook'; requestId: number }) {
  const t = useTranslations('Workbench.toolHeader');
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITEKEY || requestId === 0) return;

    const render = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITEKEY,
        action,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
        'timeout-callback': () => onToken(null),
      });
    };

    if (window.turnstile) {
      render();
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const failed = () => { script?.remove(); onToken(null); };
    script.addEventListener('load', render);
    script.addEventListener('error', failed);

    return () => {
      script?.removeEventListener('load', render);
      script?.removeEventListener('error', failed);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken, requestId, action]);

  if (!SITEKEY) return null;
  return <div>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('captchaSubmitNotice')}</Typography.Text>
    <div ref={containerRef} />
  </div>;
}
