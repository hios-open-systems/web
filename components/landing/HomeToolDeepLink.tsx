'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { workbenchTools } from '@/config/workbench';

const TOOLS = workbenchTools.filter((tool) => !tool.external);

/**
 * Same deep-link shortcut as WorkbenchLanding, but on the home route:
 * /?tool=<id> jumps straight to the tool, /?tool=random opens a random one.
 * Renders nothing.
 */
export function HomeToolDeepLink() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const param = searchParams.get('tool');
    if (!param) return;
    const target =
      param === 'random'
        ? TOOLS[Math.floor(Math.random() * TOOLS.length)]
        : TOOLS.find((tool) => tool.id === param);
    if (target) router.replace(`/${locale}${target.href}`);
  }, [searchParams, router, locale]);

  return null;
}
