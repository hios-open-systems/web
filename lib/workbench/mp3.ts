/**
 * Encoder MP3 client-side (lamejs, JS puro — no WASM, no server). Toma channel
 * data float [-1,1] (lo que produce render.ts / decodeAudioData) y devuelve un
 * ArrayBuffer MP3. Reusable por el composer y por el conversor de audio.
 */
import { Mp3Encoder } from '@breezystack/lamejs';

const BLOCK = 1152; // tamaño de frame MPEG

function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function encodeMp3(channelData: Float32Array[], sampleRate: number, kbps = 192): ArrayBuffer {
  const channels = channelData.length >= 2 ? 2 : 1;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const left = floatToInt16(channelData[0]);
  const right = channels === 2 ? floatToInt16(channelData[1]) : left;

  const chunks: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += BLOCK) {
    const l = left.subarray(i, i + BLOCK);
    const r = right.subarray(i, i + BLOCK);
    const buf = channels === 2 ? encoder.encodeBuffer(l, r) : encoder.encodeBuffer(l);
    if (buf.length > 0) chunks.push(new Uint8Array(buf));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(new Uint8Array(end));

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out.buffer;
}
