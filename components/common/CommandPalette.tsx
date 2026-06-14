'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Input, type InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { workbenchSections, workbenchTools } from '@/config/workbench';
import { EMPTY_USAGE, readUsage } from '@/lib/workbench/usage';

interface Entry {
  href: string;
  label: string;
  hint: string;
  group: string;
}

const STATIC_PAGES = [
  { key: 'home', href: '' },
  { key: 'tools', href: '/tools' },
  { key: 'workbench', href: '/workbench' },
  { key: 'calculators', href: '/calculators' },
  { key: 'pinouts', href: '/pinouts' },
  { key: 'snippets', href: '/workbench/snippets' },
  { key: 'settings', href: '/workbench/settings' },
  { key: 'feedback', href: '/workbench/feedback' },
  { key: 'random', href: '/workbench?tool=random' },
];

/**
 * Global Ctrl/Cmd+K launcher. Jump to any workbench tool or key page
 * without going back to the landing. Also opens on a `hios:command-palette`
 * custom event so other UI can trigger it later.
 */
export function CommandPalette() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('CommandPalette');
  const packs = useTranslations('Workbench.packs');
  const workbench = useTranslations('Workbench');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [usage, setUsage] = useState(EMPTY_USAGE);
  const inputRef = useRef<InputRef>(null);

  const entries = useMemo<Entry[]>(() => {
    const rank = (id: string) => {
      const p = usage.pinned.indexOf(id);
      if (p !== -1) return p;
      const r = usage.recent.indexOf(id);
      if (r !== -1) return 100 + r;
      return 1000;
    };
    const tools: Entry[] = workbenchTools
      .filter((tool) => tool.id !== 'embedded')
      .slice()
      .sort((a, b) => rank(a.id) - rank(b.id))
      .map((tool) => ({
        href: `/${locale}${tool.href}`,
        label: packs(`${tool.id}.title`),
        hint: packs(`${tool.id}.description`),
        group: t('toolsGroup'),
      }));
    const pages: Entry[] = STATIC_PAGES.map((p) => ({
      href: `/${locale}${p.href}`,
      label: t(`pages.${p.key}`),
      hint: '',
      group: t('pagesGroup'),
    }));
    const sections: Entry[] = workbenchSections.map((section) => ({
      href: `/${locale}${section.href}`,
      label: workbench(`sections.${section.id}.title`),
      hint: workbench(`sections.${section.id}.description`),
      group: t('sectionsGroup'),
    }));
    return [...pages, ...sections, ...tools];
  }, [locale, packs, t, usage, workbench]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.label.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q)
    );
  }, [entries, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hios:command-palette', onCustom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hios:command-palette', onCustom);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setUsage(readUsage());
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      if (href !== pathname) router.push(href);
    },
    [router, pathname]
  );

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[active]) {
      e.preventDefault();
      go(filtered[active].href);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      closable={false}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
      width={560}
    >
      <div style={{ padding: 16 }} onKeyDown={onListKey}>
        <Input
          ref={inputRef}
          size="large"
          prefix={<SearchOutlined />}
          placeholder={t('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
        />
        <div style={{ marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center', opacity: 0.6 }}>{t('empty')}</div>
          ) : (
            filtered.map((e, i) => (
              <button
                key={e.href}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(e.href)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: i === active ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{e.label}</span>
                {e.hint ? <span style={{ fontSize: 12, opacity: 0.65 }}>{e.hint}</span> : null}
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, opacity: 0.45 }}>{e.group}</span>
              </button>
            ))
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.5, textAlign: 'right' }}>{t('hint')}</div>
      </div>
    </Modal>
  );
}
