'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useTheme } from '@/lib/ThemeContext';
import type { ResistorPackageType } from '../ResistorVisualizer';
import { calc, clamp, formatOhm } from './calc';
import { type ESeries, isESeries } from './eseries';

export type PresetId =
  | 'custom'
  | 'esp32-adc'
  | 'audio-44k'
  | 'audio-48k'
  | 'low-power'
  | 'rgb-led'
  | 'buck-3v3';

export type TabKey =
  | 'led'
  | 'cap'
  | 'thermal'
  | 'runtime'
  | 'resistorLab'
  | 'adc'
  | 'rc'
  | 'rl'
  | 'rcl'
  | 'gain'
  | 'i2s';

const ALLOWED_TABS: TabKey[] = ['led', 'cap', 'thermal', 'runtime', 'resistorLab', 'adc', 'rc', 'rl', 'rcl', 'gain', 'i2s'];
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

export function useCalculatorState() {
  const t = useTranslations('Calculators');
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

  const [rlR, setRlR] = useState(1000);
  const [rlL, setRlL] = useState(100);
  const [rlTargetFc, setRlTargetFc] = useState(1000);

  const [rclR, setRclR] = useState(10);
  const [rclL, setRclL] = useState(10);
  const [rclC, setRclC] = useState(1);
  const [rclF, setRclF] = useState(1000);

  const [rf, setRf] = useState(10000);
  const [rg, setRg] = useState(1000);

  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState(16);
  const [channels, setChannels] = useState(2);
  const [mclkMult, setMclkMult] = useState(256);
  const [activeTab, setActiveTab] = useState<TabKey>('led');
  const [eSeries, setESeries] = useState<ESeries>('E24');

  const [band1, setBand1] = useState('2');
  const [band2, setBand2] = useState('2');
  const [multiplierBand, setMultiplierBand] = useState('100');
  const [toleranceBand, setToleranceBand] = useState('5');
  const [packageType, setPackageType] = useState<ResistorPackageType>('axial-carbon');
  const [wattage, setWattage] = useState(0.25);

  const palette = {
    page: mode === 'dark' ? '#1a1a1a' : '#f7f7f8',
    surface: mode === 'dark' ? '#202020' : '#ffffff',
    border: mode === 'dark' ? '#2f2f2f' : '#e5e7eb',
    borderSoft: mode === 'dark' ? '#3a3a3a' : '#d1d5db',
    textSecondary: mode === 'dark' ? '#b3b3b3' : '#4b5563',
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
    backgroundColor: mode === 'dark' ? '#1b1b1b' : '#ffffff',
    border: `1px solid ${palette.borderSoft}`,
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
  const cutoffValid = rcR > 0 && rcC > 0;
  const requiredRValid = targetFc > 0 && rcC > 0;
  const rlFilter = useMemo(() => calc.rlFilter(rlR, rlL), [rlR, rlL]);
  const rlRequiredL = useMemo(() => calc.rlRequiredL(rlTargetFc, rlR), [rlTargetFc, rlR]);
  const rlRequiredValid = rlTargetFc > 0 && rlR > 0;
  const rcl = useMemo(() => calc.rclSeries(rclR, rclL, rclC, rclF), [rclR, rclL, rclC, rclF]);
  const gain = useMemo(() => calc.ampGain(rf, rg), [rf, rg]);
  const i2s = useMemo(() => calc.i2sClocks(sampleRate, bitDepth, channels, mclkMult), [sampleRate, bitDepth, channels, mclkMult]);

  const resistorValue = useMemo(
    () => (Number(band1) * 10 + Number(band2)) * Number(multiplierBand),
    [band1, band2, multiplierBand]
  );

  // Inverse mode: type a resistance and back-solve the two significant
  // digits + decade multiplier so the band colors update automatically.
  const applyTargetValue = (raw: number) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return;
    const exponent = clamp(Math.floor(Math.log10(value)) - 1, -2, 7);
    const decade = Math.pow(10, exponent);
    const sig = clamp(Math.round(value / decade), 10, 99);
    setBand1(String(Math.floor(sig / 10)));
    setBand2(String(sig % 10));
    setMultiplierBand(String(decade));
  };

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

  useEffect(() => {
    if (hydratedFromUrl.current) return;

    const parseNumber = (key: string, fallback: number) => {
      const raw = searchParams.get(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const parseString = (key: string, fallback: string) => searchParams.get(key) ?? fallback;
    const tabParam = parseString('tab', 'led');

    const seriesParam = parseString('eseries', 'E24');
    if (isESeries(seriesParam)) setESeries(seriesParam);

    if ((ALLOWED_TABS as string[]).includes(tabParam)) {
      setActiveTab(tabParam as TabKey);
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
    setRlR(parseNumber('rlR', 1000));
    setRlL(parseNumber('rlL', 100));
    setRlTargetFc(parseNumber('rlTargetFc', 1000));
    setRclR(parseNumber('rclR', 10));
    setRclL(parseNumber('rclL', 10));
    setRclC(parseNumber('rclC', 1));
    setRclF(parseNumber('rclF', 1000));
    setRf(parseNumber('rf', 10000));
    setRg(parseNumber('rg', 1000));
    setSampleRate(parseNumber('sampleRate', 44100));
    setBitDepth(parseNumber('bitDepth', 16));
    setChannels(parseNumber('channels', 2));
    setMclkMult(parseNumber('mclkMult', 256));

    setBand1(parseString('band1', '2'));
    setBand2(parseString('band2', '2'));
    setMultiplierBand(parseString('multiplierBand', '100'));
    setToleranceBand(parseString('toleranceBand', '5'));
    const packageParam = parseString('packageType', 'axial-carbon');
    if ((ALLOWED_PACKAGES as string[]).includes(packageParam)) {
      setPackageType(packageParam as ResistorPackageType);
    }
    setWattage(parseNumber('wattage', 0.25));

    hydratedFromUrl.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!hydratedFromUrl.current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);
    params.set('eseries', eSeries);
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
    params.set('rlR', String(rlR));
    params.set('rlL', String(rlL));
    params.set('rlTargetFc', String(rlTargetFc));
    params.set('rclR', String(rclR));
    params.set('rclL', String(rclL));
    params.set('rclC', String(rclC));
    params.set('rclF', String(rclF));
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
    if (nextQuery !== searchParams.toString()) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [
    searchParams, router, pathname, activeTab, eSeries, supply, ledVf, ledCurrent,
    rippleCurrent, rippleDeltaV, rippleFreq, powerV, powerI, thetaJa, ambient,
    batteryMah, avgCurrent, efficiency, vinMax, vadcMax, rBottomK, rcR, rcC,
    targetFc, rlR, rlL, rlTargetFc, rclR, rclL, rclC, rclF, rf, rg, sampleRate, bitDepth, channels, mclkMult, band1, band2,
    multiplierBand, toleranceBand, packageType, wattage,
  ]);

  const applyPreset = (value: PresetId) => {
    if (value === 'rgb-led') {
      setSupply(5); setLedVf(3.2); setLedCurrent(20);
      return;
    }
    if (value === 'buck-3v3') {
      setPowerV(3.3); setPowerI(0.5); setThetaJa(40); setAmbient(30);
      setVinMax(5); setVadcMax(3); setRBottomK(10);
      return;
    }
    if (value === 'esp32-adc') {
      setVinMax(12); setVadcMax(3.1); setRBottomK(10); setRcR(10000); setRcC(100);
      return;
    }
    if (value === 'audio-44k') {
      setSampleRate(44100); setBitDepth(16); setChannels(2); setMclkMult(256);
      setRcR(10000); setRcC(100); setTargetFc(160);
      return;
    }
    if (value === 'audio-48k') {
      setSampleRate(48000); setBitDepth(24); setChannels(2); setMclkMult(256);
      setRcR(6800); setRcC(100); setTargetFc(234);
      return;
    }
    if (value === 'low-power') {
      setBatteryMah(2500); setAvgCurrent(80); setEfficiency(90);
      setPowerV(3.3); setPowerI(0.08);
    }
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

  return {
    t, palette, contextHolder,
    calcCardStyle, calcCardBodyStyle, inputStyle,
    applyPreset, activeTab, setActiveTab, eSeries, setESeries,
    copySummary, copyShareLink,
    // led
    supply, setSupply, ledVf, setLedVf, ledCurrent, setLedCurrent, led,
    // cap
    rippleCurrent, setRippleCurrent, rippleDeltaV, setRippleDeltaV,
    rippleFreq, setRippleFreq, capacitor,
    // thermal
    powerV, setPowerV, powerI, setPowerI, thetaJa, setThetaJa,
    ambient, setAmbient, thermal,
    // runtime
    batteryMah, setBatteryMah, avgCurrent, setAvgCurrent,
    efficiency, setEfficiency, runtime,
    // adc
    vinMax, setVinMax, vadcMax, setVadcMax, rBottomK, setRBottomK, divider,
    // rc
    rcR, setRcR, rcC, setRcC, targetFc, setTargetFc,
    cutoff, requiredR, cutoffValid, requiredRValid,
    // rl
    rlR, setRlR, rlL, setRlL, rlTargetFc, setRlTargetFc,
    rlFilter, rlRequiredL, rlRequiredValid,
    // rcl
    rclR, setRclR, rclL, setRclL, rclC, setRclC, rclF, setRclF, rcl,
    // gain
    rf, setRf, rg, setRg, gain,
    // i2s
    sampleRate, setSampleRate, bitDepth, setBitDepth,
    channels, setChannels, mclkMult, setMclkMult, i2s,
    // resistor lab
    band1, setBand1, band2, setBand2, multiplierBand, setMultiplierBand,
    toleranceBand, setToleranceBand, packageType, setPackageType,
    wattage, setWattage, resistorValue, resistorTolerance,
    resistorMin, resistorMax, smdCode, applyTargetValue,
  };
}

export type CalculatorState = ReturnType<typeof useCalculatorState>;
