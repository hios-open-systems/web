/* Pure, framework-free calculator math + formatting helpers.
 * Kept outside React so it can be unit-tested and reused. */

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Human-readable ohm value with an engineering suffix. */
export const formatOhm = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0 Ω';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MΩ`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)} kΩ`;
  return `${value.toFixed(2)} Ω`;
};

// E24 series (±5%) base values — the set you actually find in a parts drawer.
const E24 = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39,
  43, 47, 51, 56, 62, 68, 75, 82, 91,
];

/** Nearest standard E24 resistor value to an arbitrary resistance. */
export const nearestE24 = (value: number): number | null => {
  if (!Number.isFinite(value) || value <= 0) return null;
  const decade = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / decade; // 1 .. <10
  let best = E24[0];
  let bestErr = Infinity;
  for (const base of E24) {
    const candidate = base / 10; // map 10..91 -> 1.0..9.1
    const err = Math.abs(candidate - norm);
    if (err < bestErr) {
      bestErr = err;
      best = candidate;
    }
  }
  return best * decade;
};

export const calc = {
  ledResistor: (supply: number, ledVf: number, ledCurrentMa: number) => {
    const currentA = ledCurrentMa / 1000;
    const valid = currentA > 0 && supply > ledVf;
    if (!valid) return { resistance: 0, power: 0, valid: false };
    const resistance = (supply - ledVf) / currentA;
    const power = currentA * currentA * resistance;
    return { resistance, power, valid: true };
  },
  capacitorForRipple: (currentMa: number, rippleV: number, freqHz: number) => {
    const currentA = currentMa / 1000;
    const valid = currentA > 0 && rippleV > 0 && freqHz > 0;
    if (!valid) return { value: 0, valid: false };
    return { value: currentA / (rippleV * freqHz), valid: true };
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
    const valid = vinMax > 0 && vadcMax > 0 && rBottomK > 0 && vinMax > vadcMax;
    if (!valid) return { rTopK: 0, ratio: 1, valid: false };
    const ratio = vinMax / vadcMax;
    const rTopK = rBottomK * (ratio - 1);
    return { rTopK, ratio, valid: true };
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
  rclSeries: (rOhm: number, lMilliH: number, cMicroF: number, freqHz: number) => {
    const l = lMilliH / 1000;
    const c = cMicroF / 1_000_000;
    const valid = l > 0 && c > 0 && freqHz > 0;
    if (!valid) return { xl: 0, xc: 0, z: 0, f0: 0, q: 0, valid: false };
    const w = 2 * Math.PI * freqHz;
    const xl = w * l;
    const xc = 1 / (w * c);
    const z = Math.sqrt(rOhm * rOhm + (xl - xc) * (xl - xc));
    const f0 = 1 / (2 * Math.PI * Math.sqrt(l * c));
    const q = rOhm > 0 ? (1 / rOhm) * Math.sqrt(l / c) : 0;
    return { xl, xc, z, f0, q, valid: true };
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
