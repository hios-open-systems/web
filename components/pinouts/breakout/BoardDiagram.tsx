'use client';

import { FUNC_LABEL, funcVar } from '@/config/pinouts/modules';
import type { BoardLabel, BoardPin, BoardPinout, PinFunc } from '@/config/pinouts/modules';
import type { PinKind } from '@/config/pinouts/wiring';
import styles from './board-diagram.module.css';

/**
 * La placa como se ve en la mano, no como una tabla.
 *
 * Geometría real del ESP32-S3-DevKitC-1: 25.4 × 63 mm, pines a 2.54 mm de paso. Con
 * eso la silueta sale alargada igual que la de verdad, y el USB va ABAJO (el pin 1
 * queda arriba a la izquierda). Un dibujo que no se parece a la placa no sirve para
 * ubicarse: es lo que nos pasó con el diagrama de dos columnas.
 */
const PITCH = 30;
const BOARD_W = 300;
const PIN_TOP = 46;
const PIN_R = 5;
const PAD_TOP = 8;
const SIDE_GAP = 10;
const CHAR_W = 6.6;

/** un pin "usado" por una guía: qué se le suelda y de qué color va */
export interface PinAssign {
  name: string;
  kind: PinKind;
}

/**
 * El mapa va indexado por la etiqueta de la serigrafía (`IO10`, `5V`, `GND`), NO por
 * número de GPIO. Cuando lo indexaba por GPIO, el 5V y el GND del header quedaban
 * apagados — el diagrama decía "no los toques" justo sobre los dos pines que sí o sí
 * soldás. La alimentación es parte del cableado, no un detalle aparte.
 */
export type AssignMap = Map<string, PinAssign>;

const labelWidth = (text: string) => Math.max(36, text.length * CHAR_W + 14);

const primaryOf = (pin: BoardPin): BoardLabel => pin.labels.find((l) => l.primary) ?? pin.labels[0];

/** ancho que necesitan las etiquetas de un lado */
const sideWidth = (pins: BoardPin[], assign?: AssignMap): number =>
  pins.reduce((max, pin) => {
    const used = assign?.get(primaryOf(pin).text);
    // en modo guía mostramos QUÉ se suelda; si no, la serigrafía + funciones
    const texts = used ? [primaryOf(pin).text, used.name] : pin.labels.map((l) => l.text);
    return Math.max(max, texts.reduce((sum, t) => sum + labelWidth(t) + 6, 0));
  }, 0) + 14;

function Pin({
  pin,
  index,
  side,
  boardX,
  boardR,
  assign,
}: {
  pin: BoardPin;
  index: number;
  side: 'left' | 'right';
  boardX: number;
  boardR: number;
  assign?: AssignMap;
}) {
  const y = PIN_TOP + index * PITCH;
  const left = side === 'left';
  const primary = primaryOf(pin);
  const used = assign?.get(primary.text);

  // en modo guía, lo que NO se suelda se apaga: así el ojo va sólo a los pines tuyos
  const guideMode = !!assign;
  const dim = guideMode && !used;
  const color = used ? `var(--pw-role-${used.kind})` : funcVar(primary.func);

  // el pad de soldadura, sobre el borde de la placa (ahí va el pin real)
  const padX = left ? boardX : boardR;

  const chips: Array<{ text: string; color: string; solid: boolean }> = used
    ? [
        { text: primary.text, color, solid: true },
        { text: used.name, color, solid: false },
      ]
    : pin.labels.map((l) => ({
        text: l.text,
        color: funcVar(l.func),
        solid: !!l.primary,
      }));

  let cursor = left ? padX - SIDE_GAP : padX + SIDE_GAP;

  return (
    <g opacity={dim ? 0.28 : 1}>
      {/* pad de soldadura: cuadrado como en la placa, no un círculo */}
      <rect
        x={padX - PIN_R}
        y={y - PIN_R}
        width={PIN_R * 2}
        height={PIN_R * 2}
        rx={1.5}
        fill={dim ? 'var(--bk-surface)' : color}
        stroke={dim ? 'var(--bk-border)' : color}
        strokeWidth={1}
      />
      {/* número de posición física: es lo que contás con la placa en la mano */}
      <text
        x={left ? padX + 12 : padX - 12}
        y={y + 3.5}
        fill="var(--bk-muted)"
        fontSize={9}
        fontWeight={700}
        textAnchor={left ? 'start' : 'end'}
      >
        {pin.pos}
      </text>

      {chips.map((chip) => {
        const w = labelWidth(chip.text);
        const x = left ? cursor - w : cursor;
        cursor = left ? x - 6 : x + w + 6;
        return (
          <g key={`${chip.text}-${x}`}>
            <rect
              x={x}
              y={y - 10}
              width={w}
              height={20}
              rx={5}
              fill={chip.solid ? chip.color : 'transparent'}
              fillOpacity={chip.solid ? 0.16 : 1}
              stroke={chip.color}
              strokeOpacity={chip.solid ? 1 : 0.5}
            />
            <text
              x={x + w / 2}
              y={y + 4}
              fill={chip.color}
              fontSize={chip.solid ? 11 : 9.5}
              fontWeight={chip.solid ? 800 : 600}
              textAnchor="middle"
            >
              {chip.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function BoardDiagram({
  board,
  name,
  assign,
}: {
  board: BoardPinout;
  name: string;
  assign?: AssignMap;
}) {
  const rows = Math.max(board.left.length, board.right.length);
  const leftW = sideWidth(board.left, assign);
  const rightW = sideWidth(board.right, assign);

  const boardX = leftW;
  const boardR = boardX + BOARD_W;
  const width = boardR + rightW;

  const lastPinY = PIN_TOP + (rows - 1) * PITCH;
  const boardBottom = lastPinY + 92; // sitio para BOOT/RESET + los dos USB
  const height = boardBottom + PAD_TOP;

  // el módulo WROOM tapa el tercio de arriba (18mm de 25.4 → ~0.7 del ancho)
  const modW = BOARD_W * 0.7;
  const modX = boardX + (BOARD_W - modW) / 2;
  const modH = 7 * PITCH;

  const usbY = boardBottom - 30;
  const btnY = boardBottom - 58;

  const seen = new Set<string>();
  const funcs: PinFunc[] = [];
  [...board.left, ...board.right].forEach((pin) =>
    pin.labels.forEach((label) => {
      if (seen.has(label.func)) return;
      seen.add(label.func);
      funcs.push(label.func);
    }),
  );

  // pads REALMENTE resaltados en la placa, no entradas del mapa: el GND aparece en
  // cuatro posiciones del header, y decir "3 pines" cuando ves 4 encendidos es mentir.
  const used = assign
    ? [...board.left, ...board.right].filter((pin) => assign.has(primaryOf(pin).text)).length
    : 0;

  return (
    <>
      <div className={styles.wrap}>
        <svg
          width={width}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={
            assign
              ? `${name} visto desde arriba: ${used} pines usados por esta guía, resaltados sobre el header real. Los USB van abajo; el pin 1 arriba a la izquierda.`
              : `${name} visto desde arriba: los ${board.left.length + board.right.length} pines del header en su orden físico real. Los USB van abajo; el pin 1 arriba a la izquierda.`
          }
          fontFamily="ui-monospace, Menlo, monospace"
        >
          {/* ── PCB ── */}
          <rect
            x={boardX}
            y={PAD_TOP}
            width={BOARD_W}
            height={boardBottom - PAD_TOP}
            rx={8}
            fill="var(--bk-pcb, #12301f)"
            stroke="var(--bk-border)"
          />

          {/* módulo ESP32-S3-WROOM-1: la lata metálica */}
          <rect
            x={modX}
            y={PIN_TOP - 14}
            width={modW}
            height={modH}
            rx={3}
            fill="var(--bk-shield, #9aa4ad)"
            fillOpacity={0.92}
            stroke="var(--bk-border)"
          />
          {/* zona de antena: el rectángulo blanco impreso arriba del módulo */}
          <rect
            x={modX + modW * 0.18}
            y={PIN_TOP - 8}
            width={modW * 0.64}
            height={26}
            rx={2}
            fill="var(--bk-surface)"
            fillOpacity={0.5}
          />
          <text
            x={modX + modW / 2}
            y={PIN_TOP + modH / 2}
            fill="#1c2128"
            fontSize={10}
            fontWeight={800}
            textAnchor="middle"
          >
            ESP32-S3
          </text>
          <text
            x={modX + modW / 2}
            y={PIN_TOP + modH / 2 + 14}
            fill="#1c2128"
            fontSize={8.5}
            fontWeight={700}
            textAnchor="middle"
          >
            WROOM-1
          </text>

          {/* LED RGB integrado. Va al CENTRO del PCB a propósito: pegado al borde quedaba
              al lado del IO39, justo el pin que la guía aclara que NO es el RGB. */}
          <rect
            x={boardX + BOARD_W / 2 - 7}
            y={PIN_TOP + modH + 26}
            width={14}
            height={14}
            rx={2}
            fill="var(--pw-func-rgb, #e879f9)"
            stroke="var(--bk-border)"
          />
          <text
            x={boardX + BOARD_W / 2}
            y={PIN_TOP + modH + 54}
            fill="var(--bk-muted)"
            fontSize={7.5}
            fontWeight={700}
            textAnchor="middle"
          >
            RGB · IO38 o IO48
          </text>
          <text
            x={boardX + BOARD_W / 2}
            y={PIN_TOP + modH + 65}
            fill="var(--bk-muted)"
            fontSize={7}
            textAnchor="middle"
          >
            (según revisión)
          </text>

          {/* BOOT y RESET: los dos pulsadores de abajo */}
          {[
            { x: boardX + 40, label: 'BOOT' },
            { x: boardX + BOARD_W - 62, label: 'RESET' },
          ].map((btn) => (
            <g key={btn.label}>
              <rect
                x={btn.x}
                y={btnY}
                width={22}
                height={22}
                rx={3}
                fill="var(--bk-surface)"
                stroke="var(--bk-muted)"
              />
              <circle cx={btn.x + 11} cy={btnY + 11} r={5} fill="var(--bk-surface-muted)" />
              <text
                x={btn.x + 11}
                y={btnY - 5}
                fill="var(--bk-muted)"
                fontSize={8}
                fontWeight={700}
                textAnchor="middle"
              >
                {btn.label}
              </text>
            </g>
          ))}

          {/* los DOS USB-C, abajo. Izquierda = UART (flasheo), derecha = nativo (HID) */}
          {[
            { x: boardX + BOARD_W / 2 - 74, label: 'UART' },
            { x: boardX + BOARD_W / 2 + 10, label: 'USB' },
          ].map((usb) => (
            <g key={usb.label}>
              <rect
                x={usb.x}
                y={usbY}
                width={64}
                height={26}
                rx={5}
                fill="var(--bk-surface)"
                stroke="var(--bk-muted)"
              />
              <rect
                x={usb.x + 8}
                y={usbY + 8}
                width={48}
                height={10}
                rx={5}
                fill="var(--bk-surface-muted)"
              />
              <text
                x={usb.x + 32}
                y={usbY + 38}
                fill="var(--bk-muted)"
                fontSize={8.5}
                fontWeight={700}
                textAnchor="middle"
              >
                {usb.label}
              </text>
            </g>
          ))}

          {board.left.map((pin, index) => (
            <Pin
              key={`L${pin.pos}`}
              pin={pin}
              index={index}
              side="left"
              boardX={boardX}
              boardR={boardR}
              assign={assign}
            />
          ))}
          {board.right.map((pin, index) => (
            <Pin
              key={`R${pin.pos}`}
              pin={pin}
              index={index}
              side="right"
              boardX={boardX}
              boardR={boardR}
              assign={assign}
            />
          ))}
        </svg>
      </div>

      {assign ? (
        <p className={styles.hint}>
          Resaltados, los {used} pines que esta guía <strong>usa o reserva</strong> — incluida la
          alimentación. Los <strong>grises</strong> (USB, UART0) los usa la placa: no les sueldes nada.
          Los apagados quedan libres. El número chico al lado de cada pad es la{' '}
          <strong>posición física</strong>: es la que contás con la placa en la mano.
        </p>
      ) : (
        <div className={styles.legend}>
          {funcs.map((func) => (
            <span
              key={func}
              className={styles.chip}
              style={{ color: funcVar(func), borderColor: funcVar(func) }}
            >
              <span className={styles.dot} style={{ background: funcVar(func) }} />
              {FUNC_LABEL[func]}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
