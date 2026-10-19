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
      <Ground x={210} y={120} />
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
      <Ground x={210} y={120} />
    </Schematic>
  );
}

export function AmpSchematic({ rfText, rgText, gainText, ariaLabel }: { rfText: string; rgText: string; gainText: string; ariaLabel: string }) {
  return (
    <Schematic ariaLabel={ariaLabel}>
      <Pin x={24} y={40} text="Vin" />
      <Dot x={24} y={52} />
      <Wire d="M24 52 H150" />
      <OpAmp xIn={150} xOut={210} vy={64} nonInvertingTop />
      <Wire d="M210 64 H320" />
      <Dot x={320} y={64} />
      <Pin x={320} y={52} text="Vout" />
      {/* feedback Rf from output to inverting input */}
      <Dot x={270} y={64} />
      <Wire d="M270 64 V110 H232" />
      <ResistorH x={210} y={110} />
      <Value x={210} y={132} text={`Rf: ${rfText}`} />
      <Wire d="M188 110 H110 V76 H150" />
      {/* Rg from inverting node to ground */}
      <Dot x={110} y={76} />
      <Wire d="M110 76 H44 V84" />
      <ResistorV x={44} y={106} />
      <Value x={62} y={128} text={`Rg: ${rgText}`} anchor="start" />
      <Ground x={44} y={128} />
      <Value x={230} y={90} text={gainText} />
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

export function RclSchematic({ rText, lText, cText, ariaLabel }: { rText: string; lText: string; cText: string; ariaLabel: string }) {
  return (
    <Schematic ariaLabel={ariaLabel}>
      <Pin x={30} y={44} text="Vin" />
      <Dot x={30} y={56} />
      <Wire d="M30 56 H76" />
      <InductorH x={100} y={56} />
      <Value x={100} y={40} text={lText} />
      <Wire d="M124 56 H171" />
      <CapacitorH x={185} y={56} />
      <Value x={185} y={36} text={cText} />
      <Wire d="M199 56 H322 M250 56 V70" />
      <Dot x={250} y={56} />
      <ResistorV x={250} y={92} />
      <Value x={276} y={96} text={rText} anchor="start" />
      <Wire d="M250 114 V120" />
      <Dot x={322} y={56} />
      <Pin x={310} y={44} text="Vout = VR" />
      <Ground x={250} y={120} />
    </Schematic>
  );
}
