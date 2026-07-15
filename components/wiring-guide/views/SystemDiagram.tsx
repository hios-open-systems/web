'use client';

import { Fragment } from 'react';
import { railLabel, type Pin, type PinKind, type Rail } from '@/config/pinouts/wiring';
import { useWiringGuide } from '../WiringGuideContext';
import styles from '../wiring-guide.module.css';

/**
 * Diagrama de sistema del device: la placa al centro y cada MÓDULO colgando de ella
 * con sus GPIO, más los rieles de alimentación abajo.
 *
 * Se genera ENTERO desde `PAD_WIRING` (los mismos datos que la lista de pines y el
 * keymap, verificados contra el firmware por `test:wiring`). No hay un segundo dibujo
 * que mantener a mano: si cambia un pin en la guía, cambia acá. No puede driftar.
 */

const roleVar = (kind: string) => `var(--pw-role-${kind})`;

/** nombre de bus legible para el rótulo del módulo, según el kind dominante */
const KIND_LABEL: Record<PinKind, string> = {
  i2s: 'I2S',
  spi: 'SPI',
  i2c: 'I2C',
  mtx: 'MATRIZ',
  adc: 'ADC',
  pwm: 'PWM',
  neo: 'NEOPIXEL',
  io: 'GPIO',
  dac: 'DAC',
  dim: 'RESERVADO',
};

/** el kind que más se repite en el módulo — define el color del cable y el rótulo */
const dominantKind = (pins: Pin[]): PinKind => {
  const count = new Map<PinKind, number>();
  pins.forEach((p) => count.set(p.kind, (count.get(p.kind) ?? 0) + 1));
  let best: PinKind = pins[0]?.kind ?? 'io';
  let max = 0;
  count.forEach((n, k) => {
    if (n > max) {
      max = n;
      best = k;
    }
  });
  return best;
};

// --- layout (coordenadas del viewBox) --------------------------------------
const W = 660;
const PAD = 16;
const BOARD_X = PAD;
const BOARD_W = 150;
const MOD_X = 250;
const MOD_W = W - MOD_X - PAD; // 394
const ROW_H = 56;
const ROW_GAP = 12;
const TOP = 16;
const RAIL_GAP = 26;

const railColor = (rail: Rail) => roleVar(rail === 5 ? 'pwr5' : rail === 33 ? 'pwr33' : 'gnd');

export function SystemDiagram() {
  const guide = useWiringGuide();

  const rows = [...guide.modules]
    .sort((a, b) => a.step - b.step)
    .map((mod) => {
      const pins = guide.pins.filter((p) => p.mod === mod.id).sort((a, b) => a.gpio - b.gpio);
      return { mod, pins, kind: dominantKind(pins) };
    })
    .filter((r) => r.pins.length > 0);

  const n = rows.length;
  const modsH = n * ROW_H + (n - 1) * ROW_GAP;
  const boardCy = TOP + modsH / 2;
  const railY = TOP + modsH + RAIL_GAP;
  const railH = 26 + guide.rails.length * 16 + 8;
  const H = railY + railH + PAD;

  const rowY = (i: number) => TOP + i * (ROW_H + ROW_GAP);
  const mcuLines = guide.meta.mcu.split(' ');

  // íconos de los módulos que comen de cada riel (feedback compacto sin nombres largos)
  const iconsOn = (rail: Rail) =>
    guide.modules
      .filter((m) => m.rail === rail)
      .map((m) => m.icon)
      .join(' ');

  const railMeta = (k: 'c5' | 'c33' | 'cg') =>
    k === 'c5'
      ? { label: '5V', color: roleVar('pwr5'), feeds: iconsOn(5) || '→ de la fuente' }
      : k === 'c33'
        ? { label: '3V3', color: roleVar('pwr33'), feeds: iconsOn(33) || '→ (no se usa)' }
        : { label: 'GND', color: roleVar('gnd'), feeds: 'común a todo el device' };

  return (
    <section>
      <p className={styles.hint}>
        El device de un vistazo: la placa al centro, cada módulo con sus GPIO y de qué riel come.
        Se genera desde los mismos datos que la lista de pines (verificados contra el firmware), así
        que <strong>no puede quedar desincronizado</strong> del cableado real.
      </p>
      <div className={styles.svgScroll}>
        <svg
          width={W}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`Diagrama de sistema del ${guide.meta.title}: la placa ${guide.meta.mcu} en el centro y sus ${n} módulos colgando con los GPIO de cada uno, más los rieles de alimentación.`}
          fontFamily="ui-monospace, Menlo, monospace"
        >
          {/* placa */}
          <rect
            x={BOARD_X}
            y={TOP}
            width={BOARD_W}
            height={modsH}
            rx={12}
            fill="var(--pw-schem-panel)"
            stroke="var(--pw-wire)"
            strokeWidth={2}
          />
          {mcuLines.map((ln, i) => (
            <text
              key={i}
              x={BOARD_X + BOARD_W / 2}
              y={boardCy - (mcuLines.length - 1) * 9 + i * 18}
              fill="var(--pw-schem-ink)"
              fontSize={13}
              fontWeight={800}
              textAnchor="middle"
            >
              {ln}
            </text>
          ))}

          {/* módulos: cable + caja */}
          {rows.map((r, i) => {
            const my = rowY(i);
            const cy = my + ROW_H / 2;
            const color = roleVar(r.kind);
            // chips de GPIO con posición acumulada
            let cx = MOD_X + 74;
            const chips = r.pins.map((p) => {
              const w = 18 + String(p.gpio).length * 7;
              const item = { p, x: cx, w };
              cx += w + 5;
              return item;
            });
            return (
              <Fragment key={r.mod.id}>
                <line x1={BOARD_X + BOARD_W} y1={cy} x2={MOD_X} y2={cy} stroke={color} strokeWidth={3} />
                <circle cx={BOARD_X + BOARD_W} cy={cy} r={3.5} fill={color} />
                <rect
                  x={MOD_X}
                  y={my}
                  width={MOD_W}
                  height={ROW_H}
                  rx={10}
                  fill="var(--pw-schem-panel)"
                  stroke={color}
                  strokeWidth={1.5}
                />
                <text x={MOD_X + 14} y={my + 23} fontSize={15}>
                  {r.mod.icon}
                </text>
                <text x={MOD_X + 38} y={my + 24} fill="var(--pw-schem-ink)" fontSize={12} fontWeight={700}>
                  {r.mod.name}
                </text>
                {r.mod.rail !== null && (
                  <Fragment>
                    <rect
                      x={MOD_X + MOD_W - 52}
                      y={my + 10}
                      width={40}
                      height={17}
                      rx={8}
                      fill="none"
                      stroke={railColor(r.mod.rail)}
                    />
                    <text
                      x={MOD_X + MOD_W - 32}
                      y={my + 22}
                      fill={railColor(r.mod.rail)}
                      fontSize={10}
                      fontWeight={700}
                      textAnchor="middle"
                    >
                      {railLabel(r.mod.rail)}
                    </text>
                  </Fragment>
                )}
                <text x={MOD_X + 14} y={my + 45} fill={color} fontSize={10} fontWeight={800}>
                  {KIND_LABEL[r.kind]}
                </text>
                {chips.map(({ p, x, w }) => (
                  <Fragment key={p.gpio}>
                    <rect
                      x={x}
                      y={my + 34}
                      width={w}
                      height={16}
                      rx={5}
                      fill="var(--pw-schem-bg)"
                      stroke={roleVar(p.kind)}
                    />
                    <text
                      x={x + w / 2}
                      y={my + 45}
                      fill={roleVar(p.kind)}
                      fontSize={9.5}
                      fontWeight={700}
                      textAnchor="middle"
                    >
                      {p.gpio}
                    </text>
                  </Fragment>
                ))}
              </Fragment>
            );
          })}

          {/* rieles de alimentación */}
          <rect
            x={PAD}
            y={railY}
            width={W - 2 * PAD}
            height={railH}
            rx={10}
            fill="var(--pw-schem-panel)"
            stroke="var(--pw-wire)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text x={PAD + 14} y={railY + 19} fill="var(--pw-schem-dim)" fontSize={11} fontWeight={800}>
            ALIMENTACIÓN
          </text>
          {guide.rails.map((rl, i) => {
            const meta = railMeta(rl.k);
            const y = railY + 36 + i * 16;
            return (
              <Fragment key={rl.k}>
                <rect x={PAD + 14} y={y - 11} width={38} height={15} rx={5} fill="none" stroke={meta.color} />
                <text
                  x={PAD + 33}
                  y={y}
                  fill={meta.color}
                  fontSize={10}
                  fontWeight={800}
                  textAnchor="middle"
                >
                  {meta.label}
                </text>
                <text x={PAD + 62} y={y} fill="var(--pw-schem-dim)" fontSize={11}>
                  {meta.feeds}
                </text>
              </Fragment>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
