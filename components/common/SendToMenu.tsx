'use client';

import { Button, Dropdown, type MenuProps } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { createHandoff } from '@/lib/workbench/handoff';
import { message } from 'antd';

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
export function SendToMenu({ kind, getValue }: { kind: ChainKind; getValue: () => string | Promise<string> }) {
  const locale = useLocale();
  const t = useTranslations('Chain');
  const packs = useTranslations('Workbench.packs');
  const workspace = useTranslations('Workspace');
  const [api, contextHolder] = message.useMessage();

  const targets: Target[] =
    kind === 'json'
      ? [
          { href: '/workbench/payload', param: 'payload', packId: 'payload' },
          { href: '/workbench/type-checker', param: 'value', packId: 'type-checker', qualifier: t('asValue') },
          { href: '/workbench/object-to-types', param: 'object', packId: 'object-to-types' },
          { href: '/workbench/json-schema', param: 'input', packId: 'json-schema' },
          { href: '/workbench/object-compare', param: 'left', packId: 'object-compare' },
          { href: '/workbench/encoder', param: 'input', packId: 'encoder' },
          { href: '/workbench/hash-digest', param: 'input', packId: 'hash-digest' },
        ]
      : [{ href: '/workbench/type-checker', param: 'types', packId: 'type-checker', qualifier: t('asTypes') }];

  const go = async (target: Target) => {
    try {
    const value = await getValue();
    if (!value) return;
    const q = `handoff=${createHandoff(target.packId, { [target.param]: value })}`;
    window.location.assign(`/${locale}${target.href}?${q}`);
    } catch { api.error(workspace('error')); }
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
    <>{contextHolder}<Dropdown menu={menu} trigger={['click']}>
      <Button icon={<ExportOutlined />} style={{ borderRadius: 10 }}>
        {t('sendTo')}
      </Button>
    </Dropdown></>
  );
}
