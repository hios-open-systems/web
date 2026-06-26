import type { DiskProvider } from '../types';
import { run } from '../index';

const PS = ['-NoProfile', '-NonInteractive', '-Command'];

// Windows: uso del volumen del sistema (C:) via Win32_LogicalDisk; I/O via el
// contador PerfFormattedData del disco fisico _Total (ya viene en bytes/s).
export class WindowsDisk implements DiskProvider {
  async getUsagePct(): Promise<number | null> {
    const script =
      "$d=Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='$env:SystemDrive'\";" +
      "if($d -and $d.Size -gt 0){[int](100-($d.FreeSpace*100/$d.Size))}";
    const o = await run('powershell.exe', [...PS, script], 3000);
    if (!o) return null;
    const n = parseInt(o.trim(), 10);
    return isNaN(n) ? null : n;
  }

  async getIo(): Promise<{ rd: number; wr: number } | null> {
    const script =
      "$d=Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk|" +
      "?{$_.Name -eq '_Total'}|Select-Object -First 1;" +
      "if($d){Write-Output (\"{0};{1}\" -f $d.DiskReadBytesPersec,$d.DiskWriteBytesPersec)}";
    const o = await run('powershell.exe', [...PS, script], 3000);
    if (!o) return null;
    const [r, w] = o.trim().split(';').map((x) => parseInt(x, 10));
    return isNaN(r) || isNaN(w) ? null : { rd: r, wr: w };
  }
}
