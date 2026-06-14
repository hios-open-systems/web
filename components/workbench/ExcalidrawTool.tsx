'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
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
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(scene));
  } catch {
    /* storage full/unavailable - non-fatal */
  }
}

export function ExcalidrawTool() {
  const t = useTranslations('Workbench.excalidraw');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [booted, setBooted] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [scene, setScene] = useState<StoredScene | null>(null);
  const saveTimeout = useRef<number | null>(null);

  useEffect(() => {
    setScene(readScene());
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted || !scene) return;
    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = window.setTimeout(() => {
      writeScene(scene);
    }, 300);
    return () => {
      if (saveTimeout.current) {
        window.clearTimeout(saveTimeout.current);
      }
    };
  }, [booted, scene]);

  const themeVars = useMemo(
    () =>
      ({
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
      }) as React.CSSProperties,
    [mode],
  );

  const downloadScene = () => {
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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LS_KEY);
    }
    setScene(null);
    setEditorKey((value) => value + 1);
    messageApi.success(t('cleared'));
  };

  const initialData: ExcalidrawInitialDataState | undefined = scene
    ? {
        elements: scene.elements,
        appState: scene.appState,
        files: scene.files,
      }
    : undefined;

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
            <Button icon={<DownloadOutlined />} onClick={downloadScene} disabled={!scene}>
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
              initialData={initialData}
              onChange={(elements, appState, files) => {
                setScene({
                  version: 1,
                  elements: [...elements],
                  appState,
                  files,
                });
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
