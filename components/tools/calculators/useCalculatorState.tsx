'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import type { ResistorPackageType } from '../ResistorVisualizer';
import { calc, clamp, formatOhm } from './calc';
import { type ESeries, isESeries } from './eseries';
import { ALL_FIELDS, CALC_IDS, DEFAULTS, DEFAULT_CALC_ID, isStringField } from './registry';

export type PresetId =
  | 'custom'
  | 'esp32-adc'
  | 'audio-44k'
  | 'audio-48k'
  | 'low-power'
  | 'rgb-led'
  | 'buck-3v3';

/** El tab activo es el id de una calc del registry. */
export type TabKey = string;

const ALLOWED_PACKAGES: ResistorPackageType[] = [
  'axial-carbon',
  'axial-metal',
  'axial-ceramic',
  'axial-wirewound',
  'melf',
  'smd-0603',
  'smd-0805',
  'smd-1206',
];

/** Parches de valores por preset built-in (Plantillas). Un solo merge por preset. */
const PRESET_PATCHES: Record<string, Record<string, number | string>> = {
  'rgb-led': { supply: 5, ledVf: 3.2, ledCurrent: 20 },
  'buck-3v3': { powerV: 3.3, powerI: 0.5, thetaJa: 40, ambient: 30, vinMax: 5, vadcMax: 3, rBottomK: 10 },
  'esp32-adc': { vinMax: 12, vadcMax: 3.1, rBottomK: 10, rcR: 10000, rcC: 100 },
  'audio-44k': { sampleRate: 44100, bitDepth: 16, channels: 2, mclkMult: 256, rcR: 10000, rcC: 100, targetFc: 160 },
  'audio-48k': { sampleRate: 48000, bitDepth: 24, channels: 2, mclkMult: 256, rcR: 6800, rcC: 100, targetFc: 234 },
  'low-power': { batteryMah: 2500, avgCurrent: 80, efficiency: 90, powerV: 3.3, powerI: 0.08 },
};

export function useCalculatorState() {
  const t = useTranslations('Calculators');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();
  const copyRaw = useCopyToClipboard(messageApi);

  // --- estado central: un solo mapa de valores derivado del registry ---------
  const [values, setValues] = useState<Record<string, number | string>>(() => ({ ...DEFAULTS }));
  const [activeTab, setActiveTab] = useState<TabKey>(DEFAULT_CALC_ID);
  const [eSeries, setESeries] = useState<ESeries>('E24');

  const num = useCallback((key: string) => Number(values[key]), [values]);
  const str = useCallback((key: string) => String(values[key]), [values]);
  /** setter genérico — lo usan tanto los accessors de compat como las calcs nuevas */
  const set = (key: string, value: number | string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const palette = {
    page: 'var(--hios-bg-secondary)',
    surface: 'var(--hios-bg-elevated)',
    border: 'var(--hios-border)',
    borderSoft: 'color-mix(in srgb, var(--hios-text) 16%, transparent)',
    textSecondary: 'var(--hios-text-secondary)',
  };

  const calcCardStyle = {
    borderRadius: 14,
    border: `1px solid ${palette.border}`,
    background: palette.surface,
  };
  const calcCardBodyStyle = { padding: 20 } as const;
  const inputStyle = {
    width: '100%',
    height: 'clamp(38px, 4.6vw, 44px)',
    borderRadius: 10,
    backgroundColor: 'var(--hios-bg)',
    border: `1px solid ${palette.borderSoft}`,
  };

  const led = useMemo(() => calc.ledResistor(num('supply'), num('ledVf'), num('ledCurrent')), [num]);
  const capacitor = useMemo(
    () => calc.capacitorForRipple(num('rippleCurrent'), num('rippleDeltaV'), num('rippleFreq')),
    [num]
  );
  const thermal = useMemo(() => calc.powerAndTemp(num('powerV'), num('powerI'), num('thetaJa'), num('ambient')), [num]);
  const runtime = useMemo(() => calc.runtimeHours(num('batteryMah'), num('avgCurrent'), num('efficiency')), [num]);
  const divider = useMemo(() => calc.adcDivider(num('vinMax'), num('vadcMax'), num('rBottomK')), [num]);
  const cutoff = useMemo(() => calc.rcCutoff(num('rcR'), num('rcC')), [num]);
  const requiredR = useMemo(() => calc.rcRequiredR(num('targetFc'), num('rcC')), [num]);
  const cutoffValid = num('rcR') > 0 && num('rcC') > 0;
  const requiredRValid = num('targetFc') > 0 && num('rcC') > 0;
  const rlFilter = useMemo(() => calc.rlFilter(num('rlR'), num('rlL')), [num]);
  const rlRequiredL = useMemo(() => calc.rlRequiredL(num('rlTargetFc'), num('rlR')), [num]);
  const rlRequiredValid = num('rlTargetFc') > 0 && num('rlR') > 0;
  const rcl = useMemo(() => calc.rclSeries(num('rclR'), num('rclL'), num('rclC'), num('rclF')), [num]);
  const gain = useMemo(() => calc.ampGain(num('rf'), num('rg')), [num]);
  const i2s = useMemo(() => calc.i2sClocks(num('sampleRate'), num('bitDepth'), num('channels'), num('mclkMult')), [num]);

  const resistorValue = useMemo(
    () => (Number(str('band1')) * 10 + Number(str('band2'))) * Number(str('multiplierBand')),
    [str]
  );


  const applyTargetValue = (raw: number) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return;
    const exponent = clamp(Math.floor(Math.log10(value)) - 1, -2, 7);
    const decade = Math.pow(10, exponent);
    const sig = clamp(Math.round(value / decade), 10, 99);
    setValues((prev) => ({
      ...prev,
      band1: String(Math.floor(sig / 10)),
      band2: String(sig % 10),
      multiplierBand: String(decade),
    }));
  };

  const resistorTolerance = Number(str('toleranceBand'));
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


  useEffect(() => {
    if (hydratedFromUrl.current) return;

    const next = { ...DEFAULTS };
    for (const f of ALL_FIELDS) {
      const raw = searchParams.get(f.key);
      if (raw === null) continue;
      if (isStringField(f.key)) {
        next[f.key] = raw;
      } else {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) next[f.key] = parsed;
      }
    }
    if (!(ALLOWED_PACKAGES as string[]).includes(String(next.packageType))) {
      next.packageType = DEFAULTS.packageType;
    }
    setValues(next);

    const tabParam = searchParams.get('tab');
    if (tabParam && CALC_IDS.includes(tabParam)) setActiveTab(tabParam);

    const seriesParam = searchParams.get('eseries');
    if (seriesParam && isESeries(seriesParam)) setESeries(seriesParam);

    hydratedFromUrl.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;

    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (eSeries !== 'E24') params.set('eseries', eSeries);
    for (const f of ALL_FIELDS) {
      const v = values[f.key];
      if (String(v) !== String(f.default)) params.set(f.key, String(v));
    }

    const nextQuery = params.toString();
    if (nextQuery !== searchParams.toString()) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [searchParams, router, pathname, activeTab, eSeries, values]);

  const applyPreset = (value: PresetId) => {
    const patch = PRESET_PATCHES[value];
    if (patch) setValues((prev) => ({ ...prev, ...patch }));
  };

  const summary = useMemo(() => {
    return [
      'HIOS Embedded Calculators - Summary',
      `LED: R=${led.resistance.toFixed(0)} ohm, P=${(led.power * 1000).toFixed(1)} mW`,
      `Ripple Cap: Cmin=${(capacitor.value * 1e6).toFixed(1)} uF`,
      `Thermal: P=${thermal.power.toFixed(2)} W, dT=${thermal.rise.toFixed(1)} C, Tj=${thermal.junction.toFixed(1)} C`,
      `Runtime: ${runtime.toFixed(1)} h (${(runtime / 24).toFixed(2)} days)`,
      `Resistor: ${formatOhm(resistorValue)} +/-${resistorTolerance}% (${formatOhm(resistorMin)} - ${formatOhm(resistorMax)})`,
      `ADC Divider: Rtop=${divider.rTopK.toFixed(1)} kOhm, ratio=${divider.ratio.toFixed(2)}:1`,
      `RC: fc=${cutoff.toFixed(1)} Hz, R@target=${requiredR.toFixed(0)} ohm`,
      `Gain: ${gain.gain.toFixed(2)}x (${gain.gainDb.toFixed(2)} dB)`,
      `I2S: BCLK=${Math.round(i2s.bclk)} Hz, MCLK=${Math.round(i2s.mclk)} Hz, rate=${i2s.bitRateMbps.toFixed(3)} Mbps`,
    ].join('\n');
  }, [
    led, capacitor, thermal, runtime, resistorValue, resistorTolerance,
    resistorMin, resistorMax, divider, cutoff, requiredR, gain, i2s,
  ]);

  const copySummary = () => copyRaw(summary, t('copy_ok'));

  const copyShareLink = () => {
    const query = searchParams.toString();
    const shareUrl = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;
    return copyRaw(shareUrl, t('share_ok'));
  };

  const setter = (key: string) => (n: number) => set(key, n);

  return {
    t, palette, contextHolder,
    calcCardStyle, calcCardBodyStyle, inputStyle,
    applyPreset, activeTab, setActiveTab, eSeries, setESeries,
    copySummary, copyShareLink,
    get: (key: string) => values[key], set,
    // led
    supply: num('supply'), setSupply: setter('supply'),
    ledVf: num('ledVf'), setLedVf: setter('ledVf'),
    ledCurrent: num('ledCurrent'), setLedCurrent: setter('ledCurrent'), led,
    // cap
    rippleCurrent: num('rippleCurrent'), setRippleCurrent: setter('rippleCurrent'),
    rippleDeltaV: num('rippleDeltaV'), setRippleDeltaV: setter('rippleDeltaV'),
    rippleFreq: num('rippleFreq'), setRippleFreq: setter('rippleFreq'), capacitor,
    // thermal
    powerV: num('powerV'), setPowerV: setter('powerV'),
    powerI: num('powerI'), setPowerI: setter('powerI'),
    thetaJa: num('thetaJa'), setThetaJa: setter('thetaJa'),
    ambient: num('ambient'), setAmbient: setter('ambient'), thermal,
    // runtime
    batteryMah: num('batteryMah'), setBatteryMah: setter('batteryMah'),
    avgCurrent: num('avgCurrent'), setAvgCurrent: setter('avgCurrent'),
    efficiency: num('efficiency'), setEfficiency: setter('efficiency'), runtime,
    // adc
    vinMax: num('vinMax'), setVinMax: setter('vinMax'),
    vadcMax: num('vadcMax'), setVadcMax: setter('vadcMax'),
    rBottomK: num('rBottomK'), setRBottomK: setter('rBottomK'), divider,
    // rc
    rcR: num('rcR'), setRcR: setter('rcR'),
    rcC: num('rcC'), setRcC: setter('rcC'),
    targetFc: num('targetFc'), setTargetFc: setter('targetFc'),
    cutoff, requiredR, cutoffValid, requiredRValid,
    // rl
    rlR: num('rlR'), setRlR: setter('rlR'),
    rlL: num('rlL'), setRlL: setter('rlL'),
    rlTargetFc: num('rlTargetFc'), setRlTargetFc: setter('rlTargetFc'),
    rlFilter, rlRequiredL, rlRequiredValid,
    // rcl
    rclR: num('rclR'), setRclR: setter('rclR'),
    rclL: num('rclL'), setRclL: setter('rclL'),
    rclC: num('rclC'), setRclC: setter('rclC'),
    rclF: num('rclF'), setRclF: setter('rclF'), rcl,
    // gain
    rf: num('rf'), setRf: setter('rf'),
    rg: num('rg'), setRg: setter('rg'), gain,
    // i2s
    sampleRate: num('sampleRate'), setSampleRate: setter('sampleRate'),
    bitDepth: num('bitDepth'), setBitDepth: setter('bitDepth'),
    channels: num('channels'), setChannels: setter('channels'),
    mclkMult: num('mclkMult'), setMclkMult: setter('mclkMult'), i2s,
    // resistor lab
    band1: str('band1'), setBand1: (s: string) => set('band1', s),
    band2: str('band2'), setBand2: (s: string) => set('band2', s),
    multiplierBand: str('multiplierBand'), setMultiplierBand: (s: string) => set('multiplierBand', s),
    toleranceBand: str('toleranceBand'), setToleranceBand: (s: string) => set('toleranceBand', s),
    packageType: str('packageType') as ResistorPackageType,
    setPackageType: (p: ResistorPackageType) => set('packageType', p),
    wattage: num('wattage'), setWattage: setter('wattage'),
    resistorValue, resistorTolerance, resistorMin, resistorMax, smdCode, applyTargetValue,
  };
}

export type CalculatorState = ReturnType<typeof useCalculatorState>;
