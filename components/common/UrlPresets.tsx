'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, Input, Modal, type MenuProps } from 'antd';
import { DeleteOutlined, SaveOutlined, StarOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

interface Preset {
  id: string;
  name: string;
  query: string;
}

/**
 * Local-first named presets for any URL-state tool. Saves the current query
 * string under a name in localStorage (no account). Loading does a hard
 * navigation so the tool's existing one-time URL hydration re-runs — no
 * coupling to each tool's internal state, nothing server-side.
 */
export function UrlPresets({ storageKey }: { storageKey: string }) {
  const t = useTranslations('Presets');
  const lsKey = `hios-presets-${storageKey}`;
  const [presets, setPresets] = useState<Preset[]>([]);
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState('');

  const read = useCallback((): Preset[] => {
    try {
      const raw = window.localStorage.getItem(lsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [lsKey]);

  useEffect(() => {
    setPresets(read());
  }, [read]);

  const persist = (next: Preset[]) => {
    setPresets(next);
    try {
      window.localStorage.setItem(lsKey, JSON.stringify(next));
    } catch {
      /* storage full / unavailable — keep in-memory only */
    }
  };

  const openNaming = () => {
    setDraftName(t('defaultName', { n: presets.length + 1 }));
    setNaming(true);
  };

  const confirmSave = () => {
    const name = draftName.trim();
    if (!name) return;
    const query = window.location.search.replace(/^\?/, '');
    const next = [
      ...presets.filter((p) => p.name !== name),
      { id: `${Date.now()}`, name, query },
    ];
    persist(next);
    setNaming(false);
  };

  const load = (preset: Preset) => {
    window.location.assign(`${window.location.pathname}?${preset.query}`);
  };

  const remove = (id: string) => persist(presets.filter((p) => p.id !== id));

  const menu: MenuProps = {
    items:
      presets.length === 0
        ? [{ key: 'empty', disabled: true, label: t('empty') }]
        : presets.map((p) => ({
            key: p.id,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                <span style={{ flex: 1 }}>{p.name}</span>
                <DeleteOutlined
                  aria-label={t('delete')}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(p.id);
                  }}
                  style={{ opacity: 0.6 }}
                />
              </div>
            ),
          })),
    onClick: ({ key }) => {
      const preset = presets.find((p) => p.id === key);
      if (preset) load(preset);
    },
  };

  return (
    <>
      <Button icon={<SaveOutlined />} onClick={openNaming} style={{ borderRadius: 10 }}>
        {t('save')}
      </Button>
      <Dropdown menu={menu} trigger={['click']}>
        <Button icon={<StarOutlined />} style={{ borderRadius: 10 }}>
          {t('presets')}
          {presets.length ? ` (${presets.length})` : ''}
        </Button>
      </Dropdown>
      <Modal
        open={naming}
        onCancel={() => setNaming(false)}
        onOk={confirmSave}
        okText={t('save')}
        title={t('namePrompt')}
        width={420}
        destroyOnClose
      >
        <Input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onPressEnter={confirmSave}
          maxLength={60}
        />
      </Modal>
    </>
  );
}
