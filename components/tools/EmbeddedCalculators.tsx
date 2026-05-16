'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Card, InputNumber, Segmented, Select, Space, Tabs, Typography, message } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { ToolHeader } from '@/components/workbench/ToolHeader';
import { ResistorPackageType, ResistorVisualizer } from './ResistorVisualizer';
import styles from './embeddedCalculators.module.css';

const { Text } = Typography;

function ResultBar({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className={styles.resultBar}>
            <span className={styles.resultLabel}>{label}</span>
            <span className={styles.resultValue}>{value}</span>
            {hint ? <span className={styles.resultHint}>{hint}</span> : null}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            {children}
        </div>
    );
}

type PresetId =
  | 'custom'
  | 'esp32-adc'
  | 'audio-44k'
  | 'audio-48k'
  | 'low-power'
  | 'rgb-led'
  | 'buck-3v3';

const PRESET_IDS: PresetId[] = [
  'custom',
  'esp32-adc',
  'audio-44k',
  'audio-48k',
  'low-power',
  'rgb-led',
  'buck-3v3',
];

const calc = {
  ledResistor: (supply: number, ledVf: number, ledCurrentMa: number) => {
    const currentA = ledCurrentMa / 1000;
    if (currentA <= 0 || supply <= ledVf) return { resistance: 0, power: 0 };
    const resistance = (supply - ledVf) / currentA;
    const power = currentA * currentA * resistance;
    return { resistance, power };
  },
  capacitorForRipple: (currentMa: number, rippleV: number, freqHz: number) => {
    const currentA = currentMa / 1000;
    if (rippleV <= 0 || freqHz <= 0) return 0;
    return currentA / (rippleV * freqHz);
  },
  powerAndTemp: (voltage: number, currentA: number, thermalCPerW: number, ambientC: number) => {
    const power = voltage * currentA;
    const rise = power * thermalCPerW;
    return { power, rise, junction: ambientC + rise };
  },
  runtimeHours: (batteryMah: number, avgCurrentMa: number, efficiencyPercent: number) => {
    if (avgCurrentMa <= 0) return 0;
    return (batteryMah * (efficiencyPercent / 100)) / avgCurrentMa;
  },
  adcDivider: (vinMax: number, vadcMax: number, rBottomK: number) => {
    if (vinMax <= 0 || vadcMax <= 0 || rBottomK <= 0 || vinMax <= vadcMax) {
      return { rTopK: 0, ratio: 1 };
    }
    const ratio = vinMax / vadcMax;
    const rTopK = rBottomK * (ratio - 1);
    return { rTopK, ratio };
  },
  rcCutoff: (rOhm: number, cNanoF: number) => {
    if (rOhm <= 0 || cNanoF <= 0) return 0;
    const cFarads = cNanoF * 1e-9;
    return 1 / (2 * Math.PI * rOhm * cFarads);
  },
  rcRequiredR: (fcHz: number, cNanoF: number) => {
    if (fcHz <= 0 || cNanoF <= 0) return 0;
    const cFarads = cNanoF * 1e-9;
    return 1 / (2 * Math.PI * fcHz * cFarads);
  },
  ampGain: (rfOhm: number, rgOhm: number) => {
    if (rfOhm < 0 || rgOhm <= 0) return { gain: 1, gainDb: 0 };
    const gain = 1 + rfOhm / rgOhm;
    const gainDb = 20 * Math.log10(gain);
    return { gain, gainDb };
  },
  i2sClocks: (sampleRate: number, bits: number, channels: number, mclkMultiplier: number) => {
    if (sampleRate <= 0 || bits <= 0 || channels <= 0 || mclkMultiplier <= 0) {
      return { bclk: 0, mclk: 0, bitRateMbps: 0 };
    }
    const bclk = sampleRate * bits * channels;
    const mclk = sampleRate * mclkMultiplier;
    const bitRateMbps = bclk / 1_000_000;
    return { bclk, mclk, bitRateMbps };
  },
};

export function EmbeddedCalculators() {
  const t = useTranslations('Calculators');
  const locale = useLocale();
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [supply, setSupply] = useState(5);
  const [ledVf, setLedVf] = useState(2);
  const [ledCurrent, setLedCurrent] = useState(10);

  const [rippleCurrent, setRippleCurrent] = useState(300);
  const [rippleDeltaV, setRippleDeltaV] = useState(0.2);
  const [rippleFreq, setRippleFreq] = useState(100000);

  const [powerV, setPowerV] = useState(5);
  const [powerI, setPowerI] = useState(0.4);
  const [thetaJa, setThetaJa] = useState(35);
  const [ambient, setAmbient] = useState(30);

  const [batteryMah, setBatteryMah] = useState(2500);
  const [avgCurrent, setAvgCurrent] = useState(180);
  const [efficiency, setEfficiency] = useState(85);

  const [vinMax, setVinMax] = useState(12);
  const [vadcMax, setVadcMax] = useState(3.1);
  const [rBottomK, setRBottomK] = useState(10);

  const [rcR, setRcR] = useState(10000);
  const [rcC, setRcC] = useState(100);
  const [targetFc, setTargetFc] = useState(160);

  const [rf, setRf] = useState(10000);
  const [rg, setRg] = useState(1000);

  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState(16);
  const [channels, setChannels] = useState(2);
  const [mclkMult, setMclkMult] = useState(256);
  const [preset, setPreset] = useState<PresetId>('custom');
  const [activeTab, setActiveTab] = useState<'led' | 'cap' | 'thermal' | 'runtime' | 'resistorLab' | 'adc' | 'rc' | 'gain' | 'i2s'>('led');

  const [band1, setBand1] = useState('2');
  const [band2, setBand2] = useState('2');
  const [multiplierBand, setMultiplierBand] = useState('100');
  const [toleranceBand, setToleranceBand] = useState('5');
  const [packageType, setPackageType] = useState<ResistorPackageType>('axial-carbon');
  const [wattage, setWattage] = useState(0.25);

  const palette = {
    page: mode === 'dark' ? '#1a1a1a' : '#f7f7f8',
    surface: mode === 'dark' ? '#202020' : '#ffffff',
    surfaceElevated: mode === 'dark' ? '#242424' : '#ffffff',
    border: mode === 'dark' ? '#2f2f2f' : '#e5e7eb',
    borderSoft: mode === 'dark' ? '#3a3a3a' : '#d1d5db',
    textPrimary: mode === 'dark' ? '#f5f5f5' : '#111827',
    textSecondary: mode === 'dark' ? '#b3b3b3' : '#4b5563',
    // Follow the app-wide configurable accent instead of a hardcoded amber.
    accent: 'var(--accent)',
    accentSoft: 'color-mix(in srgb, var(--accent) 16%, transparent)',
  };

  const calcCardStyle = {
    borderRadius: 14,
    border: `1px solid ${palette.border}`,
    background: palette.surface,
  };

  const calcCardBodyStyle = {
    padding: 20,
  } as const;

  const inputStyle = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    background: mode === 'dark' ? '#1b1b1b' : '#ffffff',
    borderColor: palette.borderSoft,
  };

  const led = useMemo(() => calc.ledResistor(supply, ledVf, ledCurrent), [supply, ledVf, ledCurrent]);
  const capacitor = useMemo(
    () => calc.capacitorForRipple(rippleCurrent, rippleDeltaV, rippleFreq),
    [rippleCurrent, rippleDeltaV, rippleFreq]
  );
  const thermal = useMemo(() => calc.powerAndTemp(powerV, powerI, thetaJa, ambient), [powerV, powerI, thetaJa, ambient]);
  const runtime = useMemo(() => calc.runtimeHours(batteryMah, avgCurrent, efficiency), [batteryMah, avgCurrent, efficiency]);
  const divider = useMemo(() => calc.adcDivider(vinMax, vadcMax, rBottomK), [vinMax, vadcMax, rBottomK]);
  const cutoff = useMemo(() => calc.rcCutoff(rcR, rcC), [rcR, rcC]);
  const requiredR = useMemo(() => calc.rcRequiredR(targetFc, rcC), [targetFc, rcC]);
  const gain = useMemo(() => calc.ampGain(rf, rg), [rf, rg]);
  const i2s = useMemo(() => calc.i2sClocks(sampleRate, bitDepth, channels, mclkMult), [sampleRate, bitDepth, channels, mclkMult]);
  const resistorValue = useMemo(() => (Number(band1) * 10 + Number(band2)) * Number(multiplierBand), [band1, band2, multiplierBand]);
  const resistorTolerance = Number(toleranceBand);
  const resistorMin = resistorValue * (1 - resistorTolerance / 100);
  const resistorMax = resistorValue * (1 + resistorTolerance / 100);

  const smdCode = useMemo(() => {
    const value = resistorValue;
    if (!Number.isFinite(value) || value <= 0) return '000';

    if (value < 10) {
      return `${value.toFixed(1).replace('.', 'R')}`;
    }

    const rounded = Math.round(value);
    const digits = String(rounded);

    if (resistorTolerance <= 1 && digits.length >= 3) {
      const sig = digits.slice(0, 3).padEnd(3, '0');
      const multiplier = Math.max(digits.length - 3, 0);
      return `${sig}${multiplier}`;
    }

    const sig = digits.slice(0, 2).padEnd(2, '0');
    const multiplier = Math.max(digits.length - 2, 0);
    return `${sig}${multiplier}`;
  }, [resistorValue, resistorTolerance]);

  const digitOptions = [
    { value: '0', color: '#000000', key: 'black' },
    { value: '1', color: '#8b4513', key: 'brown' },
    { value: '2', color: '#ff0000', key: 'red' },
    { value: '3', color: '#ff8c00', key: 'orange' },
    { value: '4', color: '#ffd700', key: 'yellow' },
    { value: '5', color: '#008000', key: 'green' },
    { value: '6', color: '#1e90ff', key: 'blue' },
    { value: '7', color: '#9400d3', key: 'violet' },
    { value: '8', color: '#808080', key: 'gray' },
    { value: '9', color: '#ffffff', key: 'white' },
  ];

  const multiplierOptions = [
    { value: '1', color: '#000000', key: 'black' },
    { value: '10', color: '#8b4513', key: 'brown' },
    { value: '100', color: '#ff0000', key: 'red' },
    { value: '1000', color: '#ff8c00', key: 'orange' },
    { value: '10000', color: '#ffd700', key: 'yellow' },
    { value: '100000', color: '#008000', key: 'green' },
    { value: '1000000', color: '#1e90ff', key: 'blue' },
    { value: '10000000', color: '#9400d3', key: 'violet' },
    { value: '0.1', color: '#c0c0c0', key: 'silver' },
    { value: '0.01', color: '#d4af37', key: 'gold' },
  ];

  const toleranceOptions = [
    { value: '1', color: '#8b4513', key: 'brown' },
    { value: '2', color: '#ff0000', key: 'red' },
    { value: '5', color: '#d4af37', key: 'gold' },
    { value: '10', color: '#c0c0c0', key: 'silver' },
  ];

  const selectedBandColors = [
    digitOptions.find(o => o.value === band1)?.color || '#ff0000',
    digitOptions.find(o => o.value === band2)?.color || '#ff0000',
    multiplierOptions.find(o => o.value === multiplierBand)?.color || '#ff0000',
    toleranceOptions.find(o => o.value === toleranceBand)?.color || '#d4af37',
  ];

  const findOptionMeta = (
    options: { value: string; color: string; key: string }[],
    value: string,
    suffix: string
  ) => {
    const option = options.find((item) => item.value === value) || options[0];
    return {
      value,
      label: renderColorOption(t(`colors.${option.key}`), suffix, option.color),
    };
  };

  const formatOhm = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MΩ`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)} kΩ`;
    return `${value.toFixed(2)} Ω`;
  };

  const renderColorOption = (name: string, suffix: string, color: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          background: color,
          border: color.toLowerCase() === '#ffffff' ? '1px solid rgba(0,0,0,0.35)' : '1px solid rgba(255,255,255,0.2)',
          display: 'inline-block',
        }}
      />
      <span>{`${name} ${suffix}`}</span>
    </span>
  );

  useEffect(() => {
    if (hydratedFromUrl.current) return;

    const parseNumber = (key: string, fallback: number) => {
      const raw = searchParams.get(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const parseString = (key: string, fallback: string) => searchParams.get(key) ?? fallback;
    const presetParam = parseString('preset', 'custom');
    const allowedPresets: string[] = PRESET_IDS;
    const tabParam = parseString('tab', 'led');
    const allowedTabs = ['led', 'cap', 'thermal', 'runtime', 'resistorLab', 'adc', 'rc', 'gain', 'i2s'];

    if (allowedPresets.includes(presetParam)) {
      setPreset(presetParam as PresetId);
    }
    if (allowedTabs.includes(tabParam)) {
      setActiveTab(tabParam as 'led' | 'cap' | 'thermal' | 'runtime' | 'resistorLab' | 'adc' | 'rc' | 'gain' | 'i2s');
    }

    setSupply(parseNumber('supply', 5));
    setLedVf(parseNumber('ledVf', 2));
    setLedCurrent(parseNumber('ledCurrent', 10));
    setRippleCurrent(parseNumber('rippleCurrent', 300));
    setRippleDeltaV(parseNumber('rippleDeltaV', 0.2));
    setRippleFreq(parseNumber('rippleFreq', 100000));
    setPowerV(parseNumber('powerV', 5));
    setPowerI(parseNumber('powerI', 0.4));
    setThetaJa(parseNumber('thetaJa', 35));
    setAmbient(parseNumber('ambient', 30));
    setBatteryMah(parseNumber('batteryMah', 2500));
    setAvgCurrent(parseNumber('avgCurrent', 180));
    setEfficiency(parseNumber('efficiency', 85));
    setVinMax(parseNumber('vinMax', 12));
    setVadcMax(parseNumber('vadcMax', 3.1));
    setRBottomK(parseNumber('rBottomK', 10));
    setRcR(parseNumber('rcR', 10000));
    setRcC(parseNumber('rcC', 100));
    setTargetFc(parseNumber('targetFc', 160));
    setRf(parseNumber('rf', 10000));
    setRg(parseNumber('rg', 1000));
    setSampleRate(parseNumber('sampleRate', 44100));
    setBitDepth(parseNumber('bitDepth', 16));
    setChannels(parseNumber('channels', 2));
    setMclkMult(parseNumber('mclkMult', 256));

    const firstBand = parseString('band1', '2');
    const secondBand = parseString('band2', '2');
    const multiplier = parseString('multiplierBand', '100');
    const tolerance = parseString('toleranceBand', '5');
    setBand1(firstBand);
    setBand2(secondBand);
    setMultiplierBand(multiplier);
    setToleranceBand(tolerance);
    const packageParam = parseString('packageType', 'axial-carbon');
    const allowedPackages = ['axial-carbon', 'axial-metal', 'axial-ceramic', 'smd-0603', 'smd-0805', 'smd-1206'];
    if (allowedPackages.includes(packageParam)) {
      setPackageType(packageParam as ResistorPackageType);
    }
    setWattage(parseNumber('wattage', 0.25));

    hydratedFromUrl.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('preset', preset);
    params.set('tab', activeTab);
    params.set('supply', String(supply));
    params.set('ledVf', String(ledVf));
    params.set('ledCurrent', String(ledCurrent));
    params.set('rippleCurrent', String(rippleCurrent));
    params.set('rippleDeltaV', String(rippleDeltaV));
    params.set('rippleFreq', String(rippleFreq));
    params.set('powerV', String(powerV));
    params.set('powerI', String(powerI));
    params.set('thetaJa', String(thetaJa));
    params.set('ambient', String(ambient));
    params.set('batteryMah', String(batteryMah));
    params.set('avgCurrent', String(avgCurrent));
    params.set('efficiency', String(efficiency));
    params.set('vinMax', String(vinMax));
    params.set('vadcMax', String(vadcMax));
    params.set('rBottomK', String(rBottomK));
    params.set('rcR', String(rcR));
    params.set('rcC', String(rcC));
    params.set('targetFc', String(targetFc));
    params.set('rf', String(rf));
    params.set('rg', String(rg));
    params.set('sampleRate', String(sampleRate));
    params.set('bitDepth', String(bitDepth));
    params.set('channels', String(channels));
    params.set('mclkMult', String(mclkMult));
    params.set('band1', band1);
    params.set('band2', band2);
    params.set('multiplierBand', multiplierBand);
    params.set('toleranceBand', toleranceBand);
    params.set('packageType', packageType);
    params.set('wattage', String(wattage));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [
    searchParams,
    router,
    pathname,
    preset,
    activeTab,
    supply,
    ledVf,
    ledCurrent,
    rippleCurrent,
    rippleDeltaV,
    rippleFreq,
    powerV,
    powerI,
    thetaJa,
    ambient,
    batteryMah,
    avgCurrent,
    efficiency,
    vinMax,
    vadcMax,
    rBottomK,
    rcR,
    rcC,
    targetFc,
    rf,
    rg,
    sampleRate,
    bitDepth,
    channels,
    mclkMult,
    band1,
    band2,
    multiplierBand,
    toleranceBand,
    packageType,
    wattage,
  ]);

  const applyPreset = (value: PresetId) => {
    setPreset(value);

    if (value === 'rgb-led') {
      setSupply(5);
      setLedVf(3.2);
      setLedCurrent(20);
      return;
    }

    if (value === 'buck-3v3') {
      setPowerV(3.3);
      setPowerI(0.5);
      setThetaJa(40);
      setAmbient(30);
      setVinMax(5);
      setVadcMax(3);
      setRBottomK(10);
      return;
    }

    if (value === 'esp32-adc') {
      setVinMax(12);
      setVadcMax(3.1);
      setRBottomK(10);
      setRcR(10000);
      setRcC(100);
      return;
    }

    if (value === 'audio-44k') {
      setSampleRate(44100);
      setBitDepth(16);
      setChannels(2);
      setMclkMult(256);
      setRcR(10000);
      setRcC(100);
      setTargetFc(160);
      return;
    }

    if (value === 'audio-48k') {
      setSampleRate(48000);
      setBitDepth(24);
      setChannels(2);
      setMclkMult(256);
      setRcR(6800);
      setRcC(100);
      setTargetFc(234);
      return;
    }

    if (value === 'low-power') {
      setBatteryMah(2500);
      setAvgCurrent(80);
      setEfficiency(90);
      setPowerV(3.3);
      setPowerI(0.08);
    }
  };

  const summary = useMemo(() => {
    return [
      'HIOS Embedded Calculators - Summary',
      `LED: R=${led.resistance.toFixed(0)} ohm, P=${(led.power * 1000).toFixed(1)} mW`,
      `Ripple Cap: Cmin=${(capacitor * 1e6).toFixed(1)} uF`,
      `Thermal: P=${thermal.power.toFixed(2)} W, dT=${thermal.rise.toFixed(1)} C, Tj=${thermal.junction.toFixed(1)} C`,
      `Runtime: ${runtime.toFixed(1)} h (${(runtime / 24).toFixed(2)} days)`,
      `ADC Divider: Rtop=${divider.rTopK.toFixed(1)} kOhm, ratio=${divider.ratio.toFixed(2)}:1`,
      `RC: fc=${cutoff.toFixed(1)} Hz, R@target=${requiredR.toFixed(0)} ohm`,
      `Gain: ${gain.gain.toFixed(2)}x (${gain.gainDb.toFixed(2)} dB)`,
      `I2S: BCLK=${Math.round(i2s.bclk)} Hz, MCLK=${Math.round(i2s.mclk)} Hz, rate=${i2s.bitRateMbps.toFixed(3)} Mbps`,
    ].join('\n');
  }, [led, capacitor, thermal, runtime, divider, cutoff, requiredR, gain, i2s]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      messageApi.success(t('copy_ok'));
    } catch {
      messageApi.error(t('copy_error'));
    }
  };

  const copyShareLink = async () => {
    try {
      const query = searchParams.toString();
      const shareUrl = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success(t('share_ok'));
    } catch {
      messageApi.error(t('share_error'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%', background: palette.page, padding: '4px 2px' }}>
      {contextHolder}
      <ToolHeader
        eyebrow={t('tags.embedded')}
        title={t('title')}
        description={t('subtitle')}
        locality="local"
        actions={
          <Link href={`/${locale}/calculators/rcl`}>
            <Button>{t('go_rcl')}</Button>
          </Link>
        }
      />

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space direction="vertical" size={6} style={{ minWidth: 320 }}>
          <Text style={{ fontSize: 12, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.35 }}>
            {t('presets_label')}
          </Text>
          <Segmented
            size="small"
            value={preset}
            onChange={(value) => applyPreset(value as PresetId)}
            options={[
              { label: t('presets.custom'), value: 'custom' },
              { label: t('presets.esp32adc'), value: 'esp32-adc' },
              { label: t('presets.audio44'), value: 'audio-44k' },
              { label: t('presets.audio48'), value: 'audio-48k' },
              { label: t('presets.lowPower'), value: 'low-power' },
              { label: t('presets.rgbLed'), value: 'rgb-led' },
              { label: t('presets.buck3v3'), value: 'buck-3v3' },
            ]}
          />
        </Space>
        <Space>
          <Button onClick={copySummary} style={{ borderRadius: 10 }}>{t('copy_summary')}</Button>
          <Button onClick={copyShareLink} style={{ borderRadius: 10 }}>{t('copy_link')}</Button>
        </Space>
      </Space>

      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'led' | 'cap' | 'thermal' | 'runtime' | 'resistorLab' | 'adc' | 'rc' | 'gain' | 'i2s')}
        tabBarGutter={8}
        style={{ width: '100%' }}
        more={{ icon: <span style={{ color: palette.textSecondary }}>•••</span>, trigger: 'click' }}
        tabBarStyle={{
          marginBottom: 14,
        }}
        items={[
          {
            key: 'led',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.led.title')}</span>,
            children: (
              <Card title={t('cards.led.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.led.r')}
                  value={`${led.resistance.toFixed(0)} Ω`}
                  hint={`${t('cards.led.p')}: ${(led.power * 1000).toFixed(1)} mW`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.led.vs')}><InputNumber value={supply} onChange={(v) => setSupply(Number(v || 0))} min={0} style={inputStyle} /></Field>
                  <Field label={t('cards.led.vf')}><InputNumber value={ledVf} onChange={(v) => setLedVf(Number(v || 0))} min={0} style={inputStyle} /></Field>
                  <Field label={t('cards.led.current')}><InputNumber value={ledCurrent} onChange={(v) => setLedCurrent(Number(v || 0))} min={1} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
          {
            key: 'cap',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.cap.title')}</span>,
            children: (
              <Card title={t('cards.cap.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.cap.result')}
                  value={`${(capacitor * 1e6).toFixed(1)} µF`}
                  hint={t('cards.cap.formula')}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.cap.current')}><InputNumber value={rippleCurrent} onChange={(v) => setRippleCurrent(Number(v || 0))} min={0} style={inputStyle} /></Field>
                  <Field label={t('cards.cap.ripple')}><InputNumber value={rippleDeltaV} onChange={(v) => setRippleDeltaV(Number(v || 0))} min={0.001} step={0.01} style={inputStyle} /></Field>
                  <Field label={t('cards.cap.freq')}><InputNumber value={rippleFreq} onChange={(v) => setRippleFreq(Number(v || 0))} min={1} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
          {
            key: 'thermal',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.thermal.title')}</span>,
            children: (
              <Card title={t('cards.thermal.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.thermal.p')}
                  value={`${thermal.power.toFixed(2)} W`}
                  hint={`${t('cards.thermal.temp')}: ΔT ${thermal.rise.toFixed(1)} °C | Tj ${thermal.junction.toFixed(1)} °C`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.thermal.v')}><InputNumber value={powerV} onChange={(v) => setPowerV(Number(v || 0))} min={0} step={0.1} style={inputStyle} /></Field>
                  <Field label={t('cards.thermal.i')}><InputNumber value={powerI} onChange={(v) => setPowerI(Number(v || 0))} min={0} step={0.01} style={inputStyle} /></Field>
                  <Field label={t('cards.thermal.theta')}><InputNumber value={thetaJa} onChange={(v) => setThetaJa(Number(v || 0))} min={0} style={inputStyle} /></Field>
                  <Field label={t('cards.thermal.ta')}><InputNumber value={ambient} onChange={(v) => setAmbient(Number(v || 0))} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
          {
            key: 'runtime',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.runtime.title')}</span>,
            children: (
              <Card title={t('cards.runtime.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.runtime.hours')}
                  value={`${runtime.toFixed(1)} h`}
                  hint={`${t('cards.runtime.days')}: ${(runtime / 24).toFixed(2)}`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.runtime.battery')}><InputNumber value={batteryMah} onChange={(v) => setBatteryMah(Number(v || 0))} min={0} style={inputStyle} /></Field>
                  <Field label={t('cards.runtime.current')}><InputNumber value={avgCurrent} onChange={(v) => setAvgCurrent(Number(v || 0))} min={1} style={inputStyle} /></Field>
                  <Field label={t('cards.runtime.eff')}><InputNumber value={efficiency} onChange={(v) => setEfficiency(Number(v || 0))} min={1} max={100} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
          {
            key: 'resistorLab',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.resistorLab.title')}</span>,
            children: (
              <Card title={t('cards.resistorLab.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.resistorLab.value')}
                  value={formatOhm(resistorValue)}
                  hint={`±${resistorTolerance}% · ${t('cards.resistorLab.range')}: ${formatOhm(resistorMin)} - ${formatOhm(resistorMax)}`}
                />
                <div className={styles.fullRow} style={{ marginTop: 16 }}>
                  <ResistorVisualizer
                    packageType={packageType}
                    wattage={wattage}
                    resistorValue={resistorValue}
                    tolerance={resistorTolerance}
                    bandColors={selectedBandColors}
                    smdCode={smdCode}
                  />
                </div>
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.resistorLab.band1')}>
                    <Select
                      labelInValue
                      onChange={(item) => setBand1(String(item.value))}
                      value={findOptionMeta(digitOptions, band1, `(${band1})`)}
                      size="large"
                      options={digitOptions.map(o => ({
                        value: o.value,
                        label: renderColorOption(t(`colors.${o.key}`), `(${o.value})`, o.color),
                      }))}
                    />
                  </Field>
                  <Field label={t('cards.resistorLab.band2')}>
                    <Select
                      labelInValue
                      onChange={(item) => setBand2(String(item.value))}
                      value={findOptionMeta(digitOptions, band2, `(${band2})`)}
                      size="large"
                      options={digitOptions.map(o => ({
                        value: o.value,
                        label: renderColorOption(t(`colors.${o.key}`), `(${o.value})`, o.color),
                      }))}
                    />
                  </Field>
                  <Field label={t('cards.resistorLab.multiplier')}>
                    <Select
                      labelInValue
                      onChange={(item) => setMultiplierBand(String(item.value))}
                      value={findOptionMeta(multiplierOptions, multiplierBand, `(x${multiplierBand})`)}
                      size="large"
                      options={multiplierOptions.map(o => ({
                        value: o.value,
                        label: renderColorOption(t(`colors.${o.key}`), `(x${o.value})`, o.color),
                      }))}
                    />
                  </Field>
                  <Field label={t('cards.resistorLab.tolerance')}>
                    <Select
                      labelInValue
                      onChange={(item) => setToleranceBand(String(item.value))}
                      value={findOptionMeta(toleranceOptions, toleranceBand, `(±${toleranceBand}%)`)}
                      size="large"
                      options={toleranceOptions.map(o => ({
                        value: o.value,
                        label: renderColorOption(t(`colors.${o.key}`), `(±${o.value}%)`, o.color),
                      }))}
                    />
                  </Field>
                  <Field label={t('cards.resistorLab.package')}>
                    <Select
                      size="large"
                      value={packageType}
                      onChange={(value) => setPackageType(value as ResistorPackageType)}
                      options={[
                        { value: 'axial-carbon', label: t('cards.resistorLab.packages.axialCarbon') },
                        { value: 'axial-metal', label: t('cards.resistorLab.packages.axialMetal') },
                        { value: 'axial-ceramic', label: t('cards.resistorLab.packages.axialCeramic') },
                        { value: 'smd-0603', label: t('cards.resistorLab.packages.smd0603') },
                        { value: 'smd-0805', label: t('cards.resistorLab.packages.smd0805') },
                        { value: 'smd-1206', label: t('cards.resistorLab.packages.smd1206') },
                      ]}
                    />
                  </Field>
                  <Field label={t('cards.resistorLab.wattage')}>
                    <InputNumber
                      value={wattage}
                      onChange={(v) => setWattage(Number(v || 0.25))}
                      min={0.031}
                      step={0.125}
                      style={inputStyle}
                      addonAfter="W"
                      disabled={packageType.startsWith('smd')}
                    />
                  </Field>
                  <div className={styles.fullRow} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                    {[digitOptions.find(o => o.value === band1), digitOptions.find(o => o.value === band2), multiplierOptions.find(o => o.value === multiplierBand), toleranceOptions.find(o => o.value === toleranceBand)].map((band, idx) => (
                      <span key={idx} style={{ width: 20, height: 28, borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', background: band?.color || '#555' }} />
                    ))}
                  </div>
                  {packageType.startsWith('smd') && (
                    <span className={`${styles.note} ${styles.fullRow}`}>
                      {t('cards.resistorLab.smdCode')}: <strong>{smdCode}</strong>
                    </span>
                  )}
                </div>
              </Card>
            ),
          },
          {
            key: 'adc',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.adc.title')}</span>,
            children: (
              <Card title={t('cards.adc.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.adc.rtop')}
                  value={`${divider.rTopK.toFixed(1)} kΩ`}
                  hint={`${t('cards.adc.ratio')}: ${divider.ratio.toFixed(2)} : 1`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.adc.vin')}><InputNumber value={vinMax} onChange={(v) => setVinMax(Number(v || 0))} min={0} step={0.1} style={inputStyle} /></Field>
                  <Field label={t('cards.adc.vadc')}><InputNumber value={vadcMax} onChange={(v) => setVadcMax(Number(v || 0))} min={0} step={0.1} style={inputStyle} /></Field>
                  <Field label={t('cards.adc.rbottom')}><InputNumber value={rBottomK} onChange={(v) => setRBottomK(Number(v || 0))} min={0.1} step={0.1} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
          {
            key: 'rc',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.rc.title')}</span>,
            children: (
              <Card title={t('cards.rc.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.rc.fc')}
                  value={`${cutoff.toFixed(1)} Hz`}
                  hint={`${t('cards.rc.required')}: ${requiredR.toFixed(0)} Ω`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.rc.r')}><InputNumber value={rcR} onChange={(v) => setRcR(Number(v || 0))} min={1} style={inputStyle} /></Field>
                  <Field label={t('cards.rc.c')}><InputNumber value={rcC} onChange={(v) => setRcC(Number(v || 0))} min={0.1} step={0.1} style={inputStyle} /></Field>
                  <Field label={t('cards.rc.target')}><InputNumber value={targetFc} onChange={(v) => setTargetFc(Number(v || 0))} min={1} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
          {
            key: 'gain',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.gain.title')}</span>,
            children: (
              <Card title={t('cards.gain.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label={t('cards.gain.value')}
                  value={`${gain.gain.toFixed(2)} x`}
                  hint={`${t('cards.gain.db')}: ${gain.gainDb.toFixed(2)} dB`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.gain.rf')}><InputNumber value={rf} onChange={(v) => setRf(Number(v || 0))} min={0} style={inputStyle} /></Field>
                  <Field label={t('cards.gain.rg')}><InputNumber value={rg} onChange={(v) => setRg(Number(v || 0))} min={1} style={inputStyle} /></Field>
                  <span className={`${styles.note} ${styles.fullRow}`}>{t('cards.gain.formula')}</span>
                </div>
              </Card>
            ),
          },
          {
            key: 'i2s',
            label: <span style={{ whiteSpace: 'nowrap' }}>{t('cards.i2s.title')}</span>,
            children: (
              <Card title={t('cards.i2s.title')} style={calcCardStyle} styles={{ body: calcCardBodyStyle }}>
                <ResultBar
                  label="BCLK"
                  value={`${Math.round(i2s.bclk).toLocaleString()} Hz`}
                  hint={`MCLK: ${Math.round(i2s.mclk).toLocaleString()} Hz · ${t('cards.i2s.rate')}: ${i2s.bitRateMbps.toFixed(3)} Mbps`}
                />
                <div className={styles.fieldGrid}>
                  <Field label={t('cards.i2s.fs')}><InputNumber value={sampleRate} onChange={(v) => setSampleRate(Number(v || 0))} min={8000} style={inputStyle} /></Field>
                  <Field label={t('cards.i2s.bits')}><InputNumber value={bitDepth} onChange={(v) => setBitDepth(Number(v || 0))} min={8} step={8} style={inputStyle} /></Field>
                  <Field label={t('cards.i2s.channels')}><InputNumber value={channels} onChange={(v) => setChannels(Number(v || 0))} min={1} max={2} style={inputStyle} /></Field>
                  <Field label={t('cards.i2s.mclk')}><InputNumber value={mclkMult} onChange={(v) => setMclkMult(Number(v || 0))} min={64} step={64} style={inputStyle} /></Field>
                </div>
              </Card>
            ),
          },
        ]}
      />

    </Space>
  );
}
