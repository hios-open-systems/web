'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { readRaw, writeRaw, removeRaw } from '@/lib/storage/safeLocalStorage';
import dynamic from 'next/dynamic';
import { Button, Card, Space, Typography, message } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const ExcalidrawCanvas = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false },
);

const LS_KEY = 'hios-excalidraw-scene';

interface StoredScene {
  version: 1;
  elements: ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

function readScene(): StoredScene | null {
  const raw = readRaw(LS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredScene>;
    if (
      parsed.version === 1 &&
      Array.isArray(parsed.elements) &&
      parsed.appState &&
      typeof parsed.appState === 'object' &&
      parsed.files &&
      typeof parsed.files === 'object'
    ) {
      return {
        version: 1,
        elements: parsed.elements as ExcalidrawElement[],
        appState: parsed.appState as Partial<AppState>,
        files: parsed.files as BinaryFiles,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeScene(scene: StoredScene): void {
  writeRaw(LS_KEY, JSON.stringify(scene));
}

export function ExcalidrawTool() {
  const t = useTranslations('Workbench.excalidraw');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [booted, setBooted] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [hasScene, setHasScene] = useState(false);
  const sceneRef = useRef<StoredScene | null>(null);
  const initialDataRef = useRef<ExcalidrawInitialDataState | undefined>(undefined);
  const saveTimeout = useRef<number | null>(null);

  useEffect(() => {
    const loaded = readScene();
    sceneRef.current = loaded;
    initialDataRef.current = loaded
      ? { elements: loaded.elements, appState: loaded.appState, files: loaded.files }
      : undefined;
    setHasScene(Boolean(loaded && loaded.elements.length > 0));
    setBooted(true);
  }, []);

  useEffect(
    () => () => {
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    },
    [],
  );

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': 'var(--hios-border)',
        '--wb-surface-bg': 'var(--hios-bg)',
        '--wb-surface-soft-border': 'var(--hios-border)',
        '--wb-surface-soft-bg': 'var(--hios-bg-secondary)',
        '--wb-text-muted': 'var(--hios-text-secondary)',
      }) as React.CSSProperties,
    [],
  );

  const downloadScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    try {
      const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hios-diagram.scene.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      messageApi.error(t('downloadError'));
    }
  };

  const clearScene = () => {
    removeRaw(LS_KEY);
    sceneRef.current = null;
    initialDataRef.current = undefined;
    setHasScene(false);
    setEditorKey((value) => value + 1);
    messageApi.success(t('cleared'));
  };

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={downloadScene} disabled={!hasScene}>
              {t('downloadScene')}
            </Button>
            <Button icon={<DeleteOutlined />} onClick={clearScene}>
              {t('clear')}
            </Button>
          </Space>
        }
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
        <div style={{ height: 'min(74vh, 760px)', minHeight: 520 }}>
          {booted ? (
            <ExcalidrawCanvas
              key={editorKey}
              theme={mode}
              initialData={initialDataRef.current}
              onChange={(elements, appState, files) => {
                const next: StoredScene = { version: 1, elements: [...elements], appState, files };
                sceneRef.current = next;
                const nowHas = elements.length > 0;
                setHasScene((prev) => (prev === nowHas ? prev : nowHas));
                if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
                saveTimeout.current = window.setTimeout(() => writeScene(next), 300);
              }}
            />
          ) : (
            <div className={styles.emptyPanel}>
              <Typography.Text>{t('loading')}</Typography.Text>
            </div>
          )}
        </div>
      </Card>
    </Space>
  );
}
