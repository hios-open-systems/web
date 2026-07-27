'use client';

import { useCallback } from 'react';
import { message } from 'antd';
import { useTranslations } from 'next-intl';

type MessageLike = {
  success: (content: string) => void;
  error: (content: string) => void;
};

export function useCopyToClipboard(messageApi?: MessageLike) {
  const t = useTranslations('Workbench.common');
  return useCallback(
    async (text: string, successMessage?: string): Promise<boolean> => {
      const api: MessageLike = messageApi ?? message;
      try {
        await navigator.clipboard.writeText(text);
        api.success(successMessage ?? t('copied'));
        return true;
      } catch {
        api.error(t('copyError'));
        return false;
      }
    },
    [t, messageApi],
  );
}
