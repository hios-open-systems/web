import { readFileSync } from 'node:fs';
import type { PlatformProviders } from './types';

// WSL: corre como 'linux' pero el usuario quiere el estado del HOST Windows.
// Detectamos WSL para leer audio de Windows (via powershell.exe).
function isWSL(): boolean {
  if (process.env.WSL_DISTRO_NAME) return true;
  try { return /microsoft|wsl/i.test(readFileSync('/proc/version', 'utf8')); } catch { return false; }
}

// Selecciona los adaptadores. macOS queda para mas adelante (interfaz lista).
export async function pickProviders(): Promise<PlatformProviders> {
  if (process.platform === 'win32') {
    const { WindowsAudio } = await import('./windows/audio');
    const { WindowsSensors } = await import('./windows/sensors');
    const { WindowsNet } = await import('./windows/net');
    return { audio: new WindowsAudio(), sensors: new WindowsSensors(), net: new WindowsNet() };
  }
  if (isWSL()) {
    // WSL leyendo el host: audio de Windows (powershell.exe) + sensores/red Linux
    // (nvidia-smi anda en WSL; CPU temp del host no se ve -> null; red = la de WSL).
    const { WindowsAudio } = await import('./windows/audio');
    const { LinuxSensors } = await import('./linux/sensors');
    const { LinuxNet } = await import('./linux/net');
    return { audio: new WindowsAudio(), sensors: new LinuxSensors(), net: new LinuxNet() };
  }
  if (process.platform === 'linux') {
    const { LinuxAudio } = await import('./linux/audio');
    const { LinuxSensors } = await import('./linux/sensors');
    const { LinuxNet } = await import('./linux/net');
    return { audio: new LinuxAudio(), sensors: new LinuxSensors(), net: new LinuxNet() };
  }
  throw new Error(`Plataforma no soportada aun: ${process.platform}`);
}

// Helper compartido por los providers: corre un comando y devuelve stdout, o null
// si falla / no existe / timeout. Nunca lanza.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);

export async function run(cmd: string, args: string[], timeoutMs = 2000): Promise<string | null> {
  try {
    const { stdout } = await execFileP(cmd, args, { timeout: timeoutMs, windowsHide: true });
    return stdout;
  } catch {
    return null;
  }
}
