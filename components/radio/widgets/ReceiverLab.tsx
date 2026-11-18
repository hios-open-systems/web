'use client';

import { useState } from 'react';
import { resonatorResponse } from '@/lib/radio/physics';
import { Instrument, Screen, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { si, fmt } from '../ui/format';
import styles from '../radio.module.css';

type Arch = 'superhet' | 'sdr';
interface Block { id: string; label: string; info: string }

const CHAINS: Record<Arch, Block[]> = {
  superhet: [
    { id: 'ant', label: 'Antena', info: 'Capta todo lo que hay en el aire: tu señal y miles más.' },
    { id: 'rf', label: 'Filtro RF', info: 'Preselector: deja pasar la banda y rechaza la frecuencia imagen.' },
    { id: 'mix', label: 'Mezclador', info: 'Multiplica RF × oscilador local. A la salida aparecen la suma y la diferencia.' },
    { id: 'if', label: 'Filtro FI', info: 'Filtro fijo y muy angosto en la FI. Acá se gana la selectividad.' },
    { id: 'det', label: 'Detector', info: 'Recupera el audio: envolvente (AM), discriminador (FM) o BFO/producto (SSB, CW).' },
    { id: 'af', label: 'Audio', info: 'Amplificador de audio y parlante.' },
  ],
  sdr: [
    { id: 'ant', label: 'Antena', info: 'Igual que siempre: la antena manda.' },
    { id: 'lpf', label: 'Filtro', info: 'Pasa-bajos anti-alias: evita que entren frecuencias que el ADC confundiría.' },
    { id: 'adc', label: 'ADC / I-Q', info: 'Convierte la RF (o la salida de un mezclador I/Q) en números.' },
    { id: 'dsp', label: 'DSP', info: 'Desplaza, filtra y demodula con matemática. Cambiar de modo es cambiar software.' },
    { id: 'ui', label: 'Pantalla', info: 'Ves la "cascada": todo el espectro a la vez.' },
    { id: 'af', label: 'Audio', info: 'Salida de audio, o directo a un decodificador digital.' },
  ],
};

/** Diagrama en bloques del superheterodino vs SDR, con cálculo de FI e imagen. */
export function ReceiverLab() {
  const [arch, setArch] = useState<Arch>('superhet');
  const [rf, setRf] = useState(146e6);
  const [fi, setFi] = useState(10.7e6);
  const [picked, setPicked] = useState('mix');
  const chain = CHAINS[arch];
  const lo = rf + fi;
  const image = rf + 2 * fi;
  const rejection = -20 * Math.log10(resonatorResponse(image, rf, 20));
  const bw = 560 / chain.length;
  const info = chain.find((b) => b.id === picked) ?? chain[0];
  return (
    <Instrument badge="RX" title="Cómo funciona un receptor" hint="Tocá cada bloque. En el superheterodino, mové la frecuencia y mirá dónde queda el oscilador local y la imagen.">
      <Chips label="Arquitectura" value={arch} onChange={(a) => { setArch(a); setPicked(a === 'sdr' ? 'dsp' : 'mix'); }} options={[{ value: 'superhet', label: 'Superheterodino' }, { value: 'sdr', label: 'SDR' }]} />
      <Screen>
        <svg viewBox="0 0 600 150" role="img" aria-label={`Cadena ${arch}`}>
          {chain.map((b, i) => {
            const x = 20 + i * bw;
            const active = b.id === picked;
            return (
              <g key={b.id} onClick={() => setPicked(b.id)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={b.label}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPicked(b.id); }}>
                <rect x={x} y={40} width={bw - 18} height={50} rx={8} fill={active ? '#0e7490' : '#0b1016'} stroke={active ? '#22d3ee' : '#334155'} strokeWidth={2} />
                <text x={x + (bw - 18) / 2} y={70} textAnchor="middle" className={styles.svgStrong}>{b.label}</text>
                {i < chain.length - 1 ? <path d={`M${x + bw - 16},65 L${x + bw - 2},65`} stroke="var(--trace-1)" strokeWidth={2} /> : null}
              </g>
            );
          })}
          {arch === 'superhet' ? (
            <g>
              <rect x={20 + 2 * bw} y={110} width={bw - 18} height={30} rx={6} fill="#0b1016" stroke="var(--trace-2)" />
              <text x={20 + 2 * bw + (bw - 18) / 2} y={130} textAnchor="middle" className={styles.svgLabel} fill="var(--trace-2)">OL {si(lo, 'Hz')}</text>
              <path d={`M${20 + 2.5 * bw - 9},110 L${20 + 2.5 * bw - 9},90`} stroke="var(--trace-2)" strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      </Screen>
      <p className={styles.instrumentHint}><strong style={{ color: '#e2e8f0' }}>{info.label}:</strong> {info.info}</p>
      {arch === 'superhet' ? (
        <>
          <Controls>
            <RangeField label="Frecuencia a recibir" value={rf} min={1.8e6} max={450e6} log display={si(rf, 'Hz')} onChange={setRf} />
            <Chips label="Frecuencia intermedia" value={String(fi)} onChange={(v) => setFi(Number(v))} options={[{ value: '455000', label: 'FI 455 kHz' }, { value: '10700000', label: 'FI 10,7 MHz' }, { value: '45000000', label: 'FI 45 MHz' }]} />
          </Controls>
          <Readouts items={[
            { label: 'Oscilador local = RF + FI', value: si(lo, 'Hz') },
            { label: 'Imagen = RF + 2·FI', value: si(image, 'Hz'), tone: 'warn' },
            { label: 'Rechazo de imagen (filtro Q=20)', value: `${fmt(rejection, 3)} dB`, tone: rejection < 40 ? 'bad' : 'good' },
          ]} />
        </>
      ) : null}
    </Instrument>
  );
}
