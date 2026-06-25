import type { NetProvider } from '../types';
import { run } from '../index';

const PS = ['-NoProfile', '-NonInteractive', '-Command'];

// Windows: el contador PerfFormattedData ya viene en bytes/s (no hace falta delta).
// Sumamos las interfaces reales (sin Loopback/isatap/Teredo).
export class WindowsNet implements NetProvider {
  async getThroughput(): Promise<{ down: number; up: number } | null> {
    const script =
      "$n=Get-CimInstance Win32_PerfFormattedData_Tcpip_NetworkInterface|" +
      "?{$_.Name -notmatch 'Loopback|isatap|Teredo'};" +
      "$d=($n|Measure-Object BytesReceivedPersec -Sum).Sum;" +
      "$u=($n|Measure-Object BytesSentPersec -Sum).Sum;" +
      "Write-Output \"$d;$u\"";
    const o = await run('powershell.exe', [...PS, script], 3000);
    if (!o) return null;
    const [d, u] = o.trim().split(';').map((x) => parseInt(x, 10));
    if (isNaN(d) || isNaN(u)) return null;
    return { down: d, up: u };
  }
}
