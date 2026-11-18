'use client';

import { useState } from 'react';
import { pathLossDb, radioHorizonKm, wattsToDbm } from '@/lib/radio/physics';
import { Instrument, Controls, Readouts, Chips } from '../ui/Instrument';
import { RangeField } from '../ui/RangeField';
import { fmt, si } from '../ui/format';

const RADIOS = [
  { value: 'fm2', label: 'Handy FM 2 m', mhz: 146, w: 5, sens: -122, gain: -3 },
  { value: 'fm70', label: 'Handy FM 70 cm', mhz: 435, w: 4, sens: -122, gain: -3 },
  { value: 'sa818', label: 'SA818 (1 W)', mhz: 146, w: 1, sens: -122, gain: -3 },
  { value: 'lora', label: 'LoRa / Meshtastic', mhz: 915, w: 0.16, sens: -130, gain: 0 },
] as const;
// Pérdida extra por obstáculos: regla práctica muy gruesa, no un modelo.
const ENV = [
  { value: 'open', label: 'Campo abierto', extra: 0 },
  { value: 'suburb', label: 'Barrio de casas', extra: 10 },
  { value: 'city', label: 'Ciudad', extra: 20 },
  { value: 'dense', label: 'Centro con edificios', extra: 30 },
] as const;
const FADE_MARGIN = 10;

/** "¿Llego a 5 km?": presupuesto de enlace con horizonte radioeléctrico. */
export function LinkBudgetLab() {
  const [radio, setRadio] = useState<(typeof RADIOS)[number]['value']>('fm2');
  const [env, setEnv] = useState<(typeof ENV)[number]['value']>('city');
  const [km, setKm] = useState(5);
  const [h1, setH1] = useState(1.5);
  const [h2, setH2] = useState(1.5);
  const [antGain, setAntGain] = useState(0);
  const r = RADIOS.find((x) => x.value === radio) ?? RADIOS[0];
  const e = ENV.find((x) => x.value === env) ?? ENV[0];
  const gains = 2 * r.gain + antGain;
  const path = pathLossDb(km, r.mhz, h1, h2);
  const rx = wattsToDbm(r.w) + gains - path - e.extra;
  const margin = rx - r.sens;
  const horizon = radioHorizonKm(h1, h2);
  const ok = margin >= FADE_MARGIN && horizon >= km;
  return (
    <Instrument badge="LINK" title="¿Llego a 5 km? Presupuesto de enlace" hint="Estimación educativa: espacio libre o tierra plana (lo que pierda más) + una pérdida extra por obstáculos. Fijate cuánto cambia subir las antenas. La realidad depende de cada edificio y árbol: probalo en el terreno.">
      <Chips label="Equipo" value={radio} onChange={setRadio} options={RADIOS.map((x) => ({ value: x.value, label: x.label }))} />
      <Chips label="Entorno" value={env} onChange={setEnv} options={ENV.map((x) => ({ value: x.value, label: x.label }))} />
      <Controls>
        <RangeField label="Distancia" value={km} min={0.2} max={60} log display={`${fmt(km, 3)} km`} onChange={setKm} />
        <RangeField label="Altura antena A" value={h1} min={1} max={60} step={0.5} display={`${fmt(h1)} m`} onChange={setH1} />
        <RangeField label="Altura antena B" value={h2} min={1} max={60} step={0.5} display={`${fmt(h2)} m`} onChange={setH2} />
        <RangeField label="Ganancia extra de antenas (dB)" value={antGain} min={0} max={20} step={1} display={`+${antGain} dB`} onChange={setAntGain} />
      </Controls>
      <Readouts items={[
        { label: 'Potencia', value: `${si(r.w, 'W')} = ${fmt(wattsToDbm(r.w), 3)} dBm` },
        { label: 'Pérdida del trayecto', value: `${fmt(path, 3)} dB + ${e.extra} dB obstáculos` },
        { label: 'Señal recibida', value: `${fmt(rx, 3)} dBm` },
        { label: 'Margen sobre sensibilidad', value: `${fmt(margin, 3)} dB`, tone: margin >= FADE_MARGIN ? 'good' : margin >= 0 ? 'warn' : 'bad' },
        { label: 'Horizonte radio', value: `${fmt(horizon, 3)} km`, tone: horizon >= km ? 'good' : 'bad' },
        { label: 'Veredicto', value: ok ? 'Debería andar' : margin >= 0 && horizon >= km ? 'Al límite' : 'No llega', tone: ok ? 'good' : margin >= 0 && horizon >= km ? 'warn' : 'bad' },
      ]} />
    </Instrument>
  );
}
