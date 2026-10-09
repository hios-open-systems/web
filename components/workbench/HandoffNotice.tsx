'use client';
import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { useTranslations } from 'next-intl';
export function HandoffNotice() {
  const [failed, setFailed] = useState(false);
  const t = useTranslations('Workspace');
  useEffect(() => {
    const onError = () => setFailed(true);
    window.addEventListener('hios:handoff-error', onError);
    return () => window.removeEventListener('hios:handoff-error', onError);
  }, []);
  return failed ? <Alert type="warning" closable onClose={() => setFailed(false)} message={t('missingTransfer')} /> : null;
}
