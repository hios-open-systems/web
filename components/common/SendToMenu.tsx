'use client';

import { Button, Dropdown, type MenuProps } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';

type ChainKind = 'json' | 'tsTypes';

interface Target {
  href: string;
  param: string;
  packId: string;
  qualifier?: string;
}

/**
 * Reusable "Send to →" handoff. Carries the payload to a compatible tool via
 * a query param and a hard navigation, so the target's existing one-time URL
 * hydration picks it up — no shared store, no coupling between tools.
 */
export function SendToMenu({ kind, getValue }: { kind: ChainKind; getValue: () => string }) {
  const locale = useLocale();
  const t = useTranslations('Chain');
  const packs = useTranslations('Workbench.packs');

  const targets: Target[] =
    kind === 'json'
      ? [
          { href: '/workbench/payload', param: 'payload', packId: 'payload' },
          { href: '/workbench/type-checker', param: 'value', packId: 'type-checker', qualifier: t('asValue') },
          { href: '/workbench/object-to-types', param: 'object', packId: 'object-to-types' },
        ]
      : [{ href: '/workbench/type-checker', param: 'types', packId: 'type-checker', qualifier: t('asTypes') }];

  const go = (target: Target) => {
    const value = getValue();
    if (!value) return;
    const q = `${target.param}=${encodeURIComponent(value)}`;
    window.location.assign(`/${locale}${target.href}?${q}`);
  };

  const menu: MenuProps = {
    items: targets.map((target) => ({
      key: target.href + target.param,
      label: `${packs(`${target.packId}.title`)}${target.qualifier ? ` · ${target.qualifier}` : ''}`,
    })),
    onClick: ({ key }) => {
      const target = targets.find((x) => x.href + x.param === key);
      if (target) go(target);
    },
  };

  return (
    <Dropdown menu={menu} trigger={['click']}>
      <Button icon={<ExportOutlined />} style={{ borderRadius: 10 }}>
        {t('sendTo')}
      </Button>
    </Dropdown>
  );
}
