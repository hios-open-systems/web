'use client';

import { Button, Segmented, Slider, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import { CircuitDiagram } from './CircuitDiagram';
import { CircuitCalculations } from './CircuitCalculations';
import { useDcCircuit } from './useDcCircuit';
import styles from './circuitLab.module.css';

const MODES = ['single', 'series', 'parallel'] as const;

function CircuitControls({ circuit }: { circuit: ReturnType<typeof useDcCircuit> }) {
  const t = useTranslations('RadioBasics.lab');
  const { settings, update, format } = circuit;
  const ranges = [
    { key: 'voltage', label: 'voltage', min: 1, max: 24, step: 1, unit: 'V' },
    { key: 'r1', label: 'resistanceOne', min: 10, max: 1000, step: 10, unit: 'Ω' },
    { key: 'r2', label: 'resistanceTwo', min: 10, max: 1000, step: 10, unit: 'Ω' },
  ] as const;
  return <div className={styles.controls}>
    {ranges.filter(range => range.key !== 'r2' || settings.mode !== 'single').map(range => <div key={range.key}>
      <div className={styles.controlLabel}><span id={`dc-${range.key}-label`}>{t(range.label)}</span><output>{format(settings[range.key])} {range.unit}</output></div>
      <Slider min={range.min} max={range.max} step={range.step} value={settings[range.key]} onChange={value => update(range.key, value)} ariaLabelledByForHandle={`dc-${range.key}-label`} ariaValueTextFormatterForHandle={value => `${value} ${range.unit}`} />
    </div>)}
    <div className={styles.switchRow}><label htmlFor="dc-powered">{t('powered')}</label><Switch id="dc-powered" checked={settings.powered} onChange={checked => update('powered', checked)} /></div>
    {settings.mode !== 'single' && <div className={styles.switchRow}><label htmlFor="dc-connected">{t('connected')}</label><Switch id="dc-connected" checked={settings.connected} onChange={checked => update('connected', checked)} /></div>}
    <Button className={styles.resetButton} onClick={circuit.reset}>{t('reset')}</Button>
  </div>;
}

function CircuitReadings({ circuit }: { circuit: ReturnType<typeof useDcCircuit> }) {
  const t = useTranslations('RadioBasics.lab');
  const { result, format } = circuit;
  const readings = [
    { label: 'equivalent', value: result.equivalent, unit: 'Ω' },
    { label: 'totalCurrent', value: result.current * 1000, unit: 'mA' },
    { label: 'totalPower', value: result.power, unit: 'W' },
  ];
  return <div aria-live="polite" aria-atomic="true">
    <dl className={styles.readings}>{readings.map(item => <div key={item.label}>
      <dt>{t(item.label)}</dt><dd>{format(item.value)} <span>{item.unit}</span></dd>
    </div>)}</dl>
    <div className={styles.tableWrap}><table className={styles.resultTable}>
      <caption className={styles.srOnly}>{t('diagramTitle')}</caption>
      <thead><tr><th scope="col">{t('component')}</th><th scope="col">{t('potential')}</th><th scope="col">{t('current')}</th><th scope="col">{t('power')}</th></tr></thead>
      <tbody>{result.resistors.map(item => <tr key={item.number}>
        <th scope="row"><span className={item.number === 1 ? styles.labelOne : styles.labelTwo}>R{item.number}</span> <span className={styles.resistance}>{format(item.resistance)} Ω</span></th>
        <td>{format(item.voltage)} V</td><td>{format(item.current * 1000)} mA</td><td>{format(item.power, 4)} W</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}

export function CircuitLab() {
  const t = useTranslations('RadioBasics.lab');
  const circuit = useDcCircuit();
  return <div className={styles.lab} data-testid="dc-circuit-lab">
    <div className={styles.heading}><h3>{t('title')}</h3><p>{t('intro')}</p></div>
    <Segmented block options={MODES.map(value => ({ value, label: t(value) }))} value={circuit.settings.mode} onChange={value => circuit.update('mode', value)} />
    <div className={styles.workbench}>
      <figure className={styles.figure}><CircuitDiagram settings={circuit.settings} result={circuit.result} format={circuit.format} /><figcaption>{t('idealNote')}</figcaption></figure>
      <CircuitControls circuit={circuit} />
    </div>
    <CircuitReadings circuit={circuit} />
    <CircuitCalculations settings={circuit.settings} result={circuit.result} format={circuit.format} />
  </div>;
}
