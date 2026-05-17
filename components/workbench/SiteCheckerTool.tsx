'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Checkbox, Col, Input, InputNumber, Row, Space, Tag, Typography, message } from 'antd';
import { BellOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { isHealthySiteStatus, normalizeSiteUrl, runClientSiteCheck, type SiteCheckResult, type SiteCheckStatus } from '@/lib/workbench/siteCheck';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

interface SiteMonitor {
  id: string;
  url: string;
  intervalSeconds: number;
  timeoutMs: number;
  notifications: boolean;
  lastResult: SiteCheckResult | null;
  history: SiteCheckResult[];
  checking: boolean;
}

const STORAGE_KEY = 'hios:workbench:site-checker:v1';

function getStatusColor(status: SiteCheckStatus) {
  switch (status) {
    case 'up':
      return 'green';
    case 'opaque':
      return 'blue';
    case 'down':
      return 'red';
    case 'checking':
      return 'gold';
    default:
      return 'default';
  }
}

export function SiteCheckerTool() {
  const t = useTranslations('Workbench.siteChecker');
  const { mode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const [urlInput, setUrlInput] = useState('openhios.dev/en/workbench');
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(6000);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [monitors, setMonitors] = useState<SiteMonitor[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const monitorsRef = useRef<SiteMonitor[]>([]);
  const bootstrapped = useRef(false);

  useEffect(() => {
    monitorsRef.current = monitors;
  }, [monitors]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setNotificationPermission('Notification' in window ? Notification.permission : 'unsupported');

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as SiteMonitor[];
      setMonitors(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors));
  }, [monitors]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (notificationPermission !== 'granted' || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    new Notification(title, { body });
  }, [notificationPermission]);

  const applyMonitorResult = useCallback((monitorId: string, nextResult: SiteCheckResult) => {
    setMonitors((current) => current.map((monitor) => {
      if (monitor.id !== monitorId) {
        return monitor;
      }

      return {
        ...monitor,
        checking: false,
        lastResult: nextResult,
        history: [nextResult, ...monitor.history].slice(0, 8),
      };
    }));
  }, []);

  const executeMonitorCheck = useCallback(async (monitor: SiteMonitor) => {
    setMonitors((current) => current.map((entry) => entry.id === monitor.id ? { ...entry, checking: true } : entry));
    const previousStatus = monitor.lastResult?.status;
    const nextResult = await runClientSiteCheck(monitor.url, monitor.timeoutMs);
    applyMonitorResult(monitor.id, nextResult);

    const previousHealthy = previousStatus ? isHealthySiteStatus(previousStatus) : null;
    const nextHealthy = isHealthySiteStatus(nextResult.status);
    if (monitor.notifications && previousHealthy !== null && previousHealthy !== nextHealthy) {
      if (nextHealthy) {
        sendNotification(t('recovered'), `${monitor.url} ${t('recoveredBody')}`);
      } else {
        sendNotification(t('failed'), `${monitor.url} ${t('failedBody')}`);
      }
    }
  }, [applyMonitorResult, sendNotification, t]);

  const runMonitorCheck = useCallback(async (monitorId: string) => {
    const currentMonitor = monitorsRef.current.find((monitor) => monitor.id === monitorId);
    if (!currentMonitor) {
      return;
    }

    await executeMonitorCheck(currentMonitor);
  }, [executeMonitorCheck]);

  useEffect(() => {
    if (bootstrapped.current || monitors.length === 0) {
      return;
    }

    bootstrapped.current = true;
    monitors.forEach((monitor) => {
      if (!monitor.lastResult) {
        void runMonitorCheck(monitor.id);
      }
    });
  }, [monitors, runMonitorCheck]);

  useEffect(() => {
    if (monitors.length === 0) {
      return;
    }

    const timers = monitors.map((monitor) => window.setInterval(() => {
      void runMonitorCheck(monitor.id);
    }, Math.max(15, monitor.intervalSeconds) * 1000));

    return () => timers.forEach((timer) => window.clearInterval(timer));
  }, [monitors, runMonitorCheck]);

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      messageApi.error(t('permissionUnsupported'));
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      messageApi.success(t('permissionGranted'));
      return;
    }

    messageApi.error(t('permissionDenied'));
  };

  const addMonitor = async () => {
    const normalizedUrl = normalizeSiteUrl(urlInput);
    if (!normalizedUrl) {
      messageApi.error(t('urlInvalid'));
      return;
    }

    const nextMonitor: SiteMonitor = {
      id: crypto.randomUUID(),
      url: normalizedUrl,
      intervalSeconds: Math.max(15, intervalSeconds),
      timeoutMs: Math.max(1000, timeoutMs),
      notifications: notifyOnFailure,
      lastResult: null,
      history: [],
      checking: false,
    };

    setMonitors((current) => [nextMonitor, ...current]);
    messageApi.success(t('monitorAdded'));
    await executeMonitorCheck(nextMonitor);
  };

  const loadExample = () => {
    if (typeof window === 'undefined') {
      return;
    }

    setUrlInput(`${window.location.origin}/en/workbench`);
  };

  const permissionLabel = useMemo(() => {
    switch (notificationPermission) {
      case 'granted':
        return t('permissionGranted');
      case 'denied':
        return t('permissionDenied');
      case 'unsupported':
        return t('permissionUnsupported');
      default:
        return t('requestNotifications');
    }
  }, [notificationPermission, t]);

  const themeVars = {
    '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
    '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
    '--wb-text-muted': mode === 'dark' ? '#9ca3af' : '#475569',
    '--wb-code-bg': mode === 'dark' ? '#020617' : '#e2e8f0',
    '--wb-code-text': mode === 'dark' ? '#e2e8f0' : '#0f172a',
  } as React.CSSProperties;

  return (
    <Space direction="vertical" size={20} style={themeVars} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('badge')}
        title={t('title')}
        description={t('subtitle')}
        locality="network"
        guideId="siteChecker"
        actions={
          <Space wrap>
            <Button icon={<BellOutlined />} onClick={requestNotifications}>{permissionLabel}</Button>
            <Button icon={<ReloadOutlined />} onClick={loadExample}>{t('loadExample')}</Button>
          </Space>
        }
      />
      <div className={styles.helperTextBlock}>
        <Text>{t('clientOnly')}</Text>
        <Text>{t('corsNote')}</Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Card title={t('title')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            <Space direction="vertical" size={16} className={styles.stackFull}>
              <div className={styles.optionGrid}>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('url')}</Text>
                  <Input value={urlInput} onChange={(event) => setUrlInput(event.target.value)} placeholder="openhios.dev/en/workbench" />
                </div>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('interval')}</Text>
                  <InputNumber min={15} max={3600} value={intervalSeconds} onChange={(value) => setIntervalSeconds(value ?? 60)} style={{ width: '100%' }} />
                </div>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('timeout')}</Text>
                  <InputNumber min={1000} max={30000} step={500} value={timeoutMs} onChange={(value) => setTimeoutMs(value ?? 6000)} style={{ width: '100%' }} />
                </div>
                <div className={styles.metricCard}>
                  <Text className={styles.metricLabel}>{t('notifications')}</Text>
                  <Checkbox checked={notifyOnFailure} onChange={(event) => setNotifyOnFailure(event.target.checked)}>{t('notifications')}</Checkbox>
                </div>
              </div>

              <Button type="primary" icon={<PlusOutlined />} onClick={() => void addMonitor()}>{t('addMonitor')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={t('monitors')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
            {monitors.length === 0 ? (
              <div className={styles.emptyPanel}>
                <Text>{t('empty')}</Text>
              </div>
            ) : (
              <div className={styles.monitorList}>
                {monitors.map((monitor) => {
                  const status = monitor.checking ? 'checking' : monitor.lastResult?.status ?? 'idle';
                  return (
                    <div key={monitor.id} className={styles.monitorCard}>
                      <div className={styles.monitorHeader}>
                        <div className={styles.monitorTitleBlock}>
                          <Text strong className={styles.generatedValue}>{monitor.url}</Text>
                          <Text className={styles.subtleText}>{monitor.intervalSeconds}s · {monitor.timeoutMs}ms</Text>
                        </div>
                        <Space wrap>
                          <Tag color={getStatusColor(status)}>{status === 'up' ? t('healthy') : status === 'opaque' ? t('reachable') : status === 'down' ? t('down') : t('checking')}</Tag>
                          <Button size="small" icon={<ReloadOutlined />} onClick={() => void runMonitorCheck(monitor.id)}>{t('runNow')}</Button>
                          <Button size="small" icon={<DeleteOutlined />} onClick={() => setMonitors((current) => current.filter((entry) => entry.id !== monitor.id))}>{t('remove')}</Button>
                        </Space>
                      </div>

                      <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                          <Text className={styles.metricLabel}>{t('latency')}</Text>
                          <Text strong>{monitor.lastResult?.latencyMs ?? '-'}{monitor.lastResult?.latencyMs !== null && monitor.lastResult?.latencyMs !== undefined ? ' ms' : ''}</Text>
                        </div>
                        <div className={styles.metricCard}>
                          <Text className={styles.metricLabel}>{t('lastChecked')}</Text>
                          <Text strong>{monitor.lastResult ? new Date(monitor.lastResult.checkedAt).toLocaleTimeString() : '-'}</Text>
                        </div>
                        <div className={styles.metricCard}>
                          <Text className={styles.metricLabel}>{t('httpStatus')}</Text>
                          <Text strong>{monitor.lastResult?.httpStatus ?? '-'}</Text>
                        </div>
                      </div>

                      <div className={styles.monitorBody}>
                        <Text className={styles.metricLabel}>{t('detail')}</Text>
                        <Text className={styles.pathPreview}>{monitor.lastResult?.detail ?? t('stopped')}</Text>
                        {monitor.lastResult?.contentType ? <Text className={styles.subtleText}>{t('contentType')}: {monitor.lastResult.contentType}</Text> : null}
                        <Checkbox checked={monitor.notifications} onChange={(event) => setMonitors((current) => current.map((entry) => entry.id === monitor.id ? { ...entry, notifications: event.target.checked } : entry))}>{t('notifications')}</Checkbox>
                      </div>

                      {monitor.history.length > 0 ? (
                        <div className={styles.historyList}>
                          <Text className={styles.metricLabel}>{t('history')}</Text>
                          {monitor.history.map((entry, index) => (
                            <div key={`${monitor.id}-${entry.checkedAt}-${index}`} className={styles.historyItem}>
                              <Tag color={getStatusColor(entry.status)}>{entry.status === 'up' ? t('healthy') : entry.status === 'opaque' ? t('reachable') : t('down')}</Tag>
                              <Text className={styles.historyTime}>{new Date(entry.checkedAt).toLocaleTimeString()}</Text>
                              <Text className={styles.pathPreview}>{entry.latencyMs ?? '-'} ms</Text>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}