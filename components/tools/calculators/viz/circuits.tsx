import {
  Schematic, Wire, Dot, Value, Pin, Ground,
  ResistorH, ResistorV, CapacitorDown, CapacitorH, InductorH, OpAmp, LedSym,
} from './schematic';

/* Composed circuit diagrams. Each labels live component values on top of the
 * reusable primitives. Coordinates live in the 360×150 schematic space. */

export function RcSchematic({ rText, cText }: { rText: string; cText: string }) {
  return (
    <Schematic ariaLabel="RC low-pass filter">
      <Pin x={30} y={44} text="Vin" />
      <Dot x={30} y={56} />
      <Wire d="M30 56 H88" />
      <ResistorH x={110} y={56} />
      <Value x={110} y={40} text={rText} />
      <Wire d="M132 56 H210" />
      <Dot x={210} y={56} />
      <CapacitorDown x={210} y={56} />
      <Value x={238} y={78} text={cText} anchor="start" />
      <Wire d="M210 86 V120" />
      <Wire d="M210 56 H322" />
      <Dot x={322} y={56} />
      <Pin x={322} y={44} text="Vout" />
      <Wire d="M30 56 V120 M322 56 V120 M30 120 H322" />
      <Ground x={176} y={120} />
    </Schematic>
  );
}

export function RlSchematic({ rText, lText }: { rText: string; lText: string }) {
  return (
    <Schematic ariaLabel="RL low-pass filter">
      <Pin x={30} y={44} text="Vin" />
      <Dot x={30} y={56} />
      <Wire d="M30 56 H86" />
      <InductorH x={110} y={56} />
      <Value x={110} y={40} text={lText} />
      <Wire d="M134 56 H210" />
      <Dot x={210} y={56} />
      <Wire d="M210 56 V70" />
      <ResistorV x={210} y={92} />
      <Value x={238} y={96} text={rText} anchor="start" />
      <Wire d="M210 114 V120" />
      <Wire d="M210 56 H322" />
      <Dot x={322} y={56} />
      <Pin x={322} y={44} text="Vout" />
      <Wire d="M30 56 V120 M322 56 V120 M30 120 H322" />
      <Ground x={120} y={120} />
    </Schematic>
  );
}

export function AmpSchematic({ rfText, rgText, gainText }: { rfText: string; rgText: string; gainText: string }) {
  return (
    <Schematic ariaLabel="Non-inverting amplifier">
      <Pin x={24} y={66} text="Vin" />
      <Dot x={24} y={78} />
      <Wire d="M24 78 H150" />
      <OpAmp xIn={150} xOut={210} vy={78} />
      <Wire d="M210 78 H320" />
      <Dot x={320} y={78} />
      <Pin x={320} y={66} text="Vout" />
      {/* feedback Rf from output to inverting input */}
      <Wire d="M260 78 V36 H190" />
      <ResistorH x={168} y={36} />
      <Value x={168} y={24} text={rfText} />
      <Wire d="M146 36 H140 V60 H150" />
      {/* Rg from inverting node to ground */}
      <Wire d="M140 60 V96" />
      <ResistorV x={140} y={118} />
      <Value x={166} y={122} text={rgText} anchor="start" />
      <Wire d="M140 140 V146" />
      <Ground x={140} y={146} />
      <Value x={250} y={108} text={gainText} anchor="middle" />
    </Schematic>
  );
}

export function LedSchematic({ rText, vfText }: { rText: string; vfText: string }) {
  return (
    <Schematic ariaLabel="LED with series resistor">
      <Pin x={30} y={44} text="V+" />
      <Dot x={30} y={56} />
      <Wire d="M30 56 H88" />
      <ResistorH x={110} y={56} />
      <Value x={110} y={40} text={rText} />
      <Wire d="M132 56 H190" />
      <LedSym x={210} y={56} />
      <Value x={232} y={44} text={vfText} anchor="start" />
      <Wire d="M218 56 H300 V120 H30 V56" />
      <Ground x={210} y={120} />
    </Schematic>
  );
}

export function AdcSchematic({ rTopText, rBotText }: { rTopText: string; rBotText: string }) {
  return (
    <Schematic ariaLabel="Resistive ADC divider">
      <Pin x={110} y={26} text="Vin" />
      <Dot x={110} y={36} />
      <Wire d="M110 36 V42" />
      <ResistorV x={110} y={62} />
      <Value x={136} y={66} text={rTopText} anchor="start" />
      <Wire d="M110 84 V96" />
      <Dot x={110} y={96} />
      <Wire d="M110 96 H210" />
      <Pin x={250} y={92} text="→ ADC" />
      <ResistorV x={110} y={118} />
      <Value x={136} y={122} text={rBotText} anchor="start" />
      <Wire d="M110 96 V108 M110 140 V146" />
      <Ground x={110} y={146} />
    </Schematic>
  );
}

export function RclSchematic({ rText, lText, cText }: { rText: string; lText: string; cText: string }) {
  return (
    <Schematic ariaLabel="Series RLC circuit">
      <Pin x={30} y={44} text="Vs" />
      <Dot x={30} y={56} />
      <Wire d="M30 56 H66" />
      <ResistorH x={92} y={56} />
      <Value x={92} y={40} text={rText} />
      <Wire d="M114 56 H156" />
      <InductorH x={180} y={56} />
      <Value x={180} y={40} text={lText} />
      <Wire d="M204 56 H252" />
      <CapacitorH x={270} y={56} />
      <Value x={270} y={40} text={cText} />
      <Wire d="M284 56 H330 V120 H30 V56" />
      <Ground x={180} y={120} />
    </Schematic>
  );
}
