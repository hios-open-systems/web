'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import styles from './serialMonitor.module.css';
import { ToolPresetBinding, numberField, booleanField } from './ToolPresetBinding';

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream;
  writable: WritableStream;
}

export function SerialMonitor() {
  const t = useTranslations('SerialMonitor');
  const [isSupported, setIsSupported] = useState(true);
  const [port, setPort] = useState<SerialPort | null>(null);
  const [baudRate, setBaudRate] = useState(115200);
  const [logs, setLogs] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [appendNewline, setAppendNewline] = useState(true);

  const terminalRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const outputStreamRef = useRef<WritableStreamDefaultWriter | null>(null);
  const portRef = useRef<SerialPort | null>(null);
  const streamsRef = useRef<Promise<void>[]>([]);
  const generation = useRef(0);
  const connecting = useRef(false);

  useEffect(() => () => {
    generation.current++;
    void readerRef.current?.cancel().catch(() => {});
    void outputStreamRef.current?.close().catch(() => {});
    const active = portRef.current;
    void Promise.allSettled(streamsRef.current).then(() => active?.close()).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const connect = async () => {
    if (connecting.current || portRef.current) return;
    connecting.current = true;
    const ticket = ++generation.current;
    try {
      const navSerial = (navigator as unknown as { serial: { requestPort: () => Promise<SerialPort> } }).serial;
      const p = await navSerial.requestPort();
      await p.open({ baudRate });
      if (ticket !== generation.current) { await p.close(); return; }
      portRef.current = p;
      setPort(p);

      // Setup output stream
      const textEncoder = new TextEncoderStream();
      const outputPipe = textEncoder.readable.pipeTo(p.writable).catch(() => {});
      outputStreamRef.current = textEncoder.writable.getWriter();

      // Setup input stream
      const textDecoder = new TextDecoderStream();
      const inputPipe = p.readable.pipeTo(textDecoder.writable).catch(() => {});
      streamsRef.current = [inputPipe, outputPipe];
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      readLoop(reader);
    } catch (e) {
      console.error('Connection failed:', e);
    } finally { connecting.current = false; }
  };

  const disconnect = async () => {
    generation.current++;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (outputStreamRef.current) {
        await outputStreamRef.current.close();
        outputStreamRef.current = null;
      }
      if (port) {
        await Promise.allSettled(streamsRef.current);
        await port.close();
        portRef.current = null;
        setPort(null);
      }
    } catch (e) {
      console.error('Disconnect error:', e);
      // Fallback: force state clean
      setPort(null);
    }
  };

  const readLoop = async (reader: ReadableStreamDefaultReader) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setLogs((prev) => (prev + value).slice(-1_000_000));
        }
      }
    } catch (error) {
      console.error('Read loop error:', error);
    } finally {
      reader.releaseLock();
    }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!outputStreamRef.current || !inputValue) return;

    try {
      const payload = appendNewline ? inputValue + '\r\n' : inputValue;
      await outputStreamRef.current.write(payload);
      setInputValue('');
    } catch (error) {
      console.error('Write error:', error);
    }
  };

  const clearLogs = () => setLogs('');

  if (!isSupported) {
    return (
      <div className={styles.unsupported}>
        <h3>{t('unsupportedTitle')}</h3>
        <p>{t('unsupportedDesc')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToolPresetBinding toolId="serial-monitor" fields={{ baudRate: numberField(baudRate, setBaudRate, 300, 2_000_000), appendNewline: booleanField(appendNewline, setAppendNewline) }} />
      <div className={styles.header}>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={!!port}
          >
            <option value={9600}>9600 baud</option>
            <option value={14400}>14400 baud</option>
            <option value={38400}>38400 baud</option>
            <option value={57600}>57600 baud</option>
            <option value={115200}>115200 baud</option>
            <option value={921600}>921600 baud</option>
          </select>
          {port ? (
            <button onClick={disconnect} className={styles.btn}>
              {t('disconnect')}
            </button>
          ) : (
            <button onClick={connect} className={`${styles.btn} ${styles.btnPrimary}`}>
              {t('connect')}
            </button>
          )}
          <span className={`${styles.status} ${port ? styles.statusConnected : styles.statusDisconnected}`}>
            {port ? t('statusConnected') : t('statusDisconnected')}
          </span>
        </div>
        <button onClick={clearLogs} className={styles.btn}>
          {t('clear')}
        </button>
      </div>

      <div className={styles.terminal} ref={terminalRef}>
        {logs || t('emptyTerminal')}
      </div>

      <form className={styles.inputRow} onSubmit={send}>
        <input
          type="text"
          className={styles.input}
          placeholder={t('inputPlaceholder')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!port}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hios-text)', fontSize: '13px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={appendNewline} 
            onChange={(e) => setAppendNewline(e.target.checked)} 
            disabled={!port}
          />
          \r\n
        </label>
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!port}>
          {t('send')}
        </button>
      </form>
    </div>
  );
}
