'use client';

import { useEffect, useRef } from 'react';

// Widget de Cloudflare Turnstile, feature-flagged por NEXT_PUBLIC_TURNSTILE_SITEKEY.
// Si la var no está seteada, NO renderiza nada y el form sigue funcionando sin
// captcha (local-first: la protección es opcional, no rompe el feedback anónimo).
// El siteverify server-side vive en app/api/feedback/route.ts.

const SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

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

export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITEKEY) return;

    const render = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITEKEY,
        action: 'feedback',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
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
    script.addEventListener('load', render);

    return () => {
      script?.removeEventListener('load', render);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken]);

  if (!SITEKEY) return null;
  return <div ref={containerRef} style={{ minHeight: 65 }} />;
}
