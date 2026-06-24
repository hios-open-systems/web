import type { SensorProvider } from '../types';
import { run } from '../index';

const PS = ['-NoProfile', '-NonInteractive', '-Command'];

// Windows: GPU via nvidia-smi (en PATH con el driver). CPU temp via
// LibreHardwareMonitor (expone WMI root/LibreHardwareMonitor; hay que tenerlo
// corriendo). CPU load via contador de perfomance.
export class WindowsSensors implements SensorProvider {
  async getGpuTempC(): Promise<number | null> { return this.nvidia('temperature.gpu'); }
  async getGpuLoadPct(): Promise<number | null> { return this.nvidia('utilization.gpu'); }

  private async nvidia(query: string): Promise<number | null> {
    const o = await run('nvidia-smi', [`--query-gpu=${query}`, '--format=csv,noheader,nounits']);
    if (!o) return null;
    const n = parseInt(o.trim().split('\n')[0], 10);
    return isNaN(n) ? null : n;
  }

  // Requiere LibreHardwareMonitor abierto. Si no esta, devuelve null -> el pad
  // muestra "s/d" en CPU temp (degradacion limpia).
  async getCpuTempC(): Promise<number | null> {
    const script =
      "$s=Get-CimInstance -Namespace root/LibreHardwareMonitor -Class Sensor -ErrorAction SilentlyContinue|" +
      "?{$_.SensorType -eq 'Temperature' -and $_.Name -match 'CPU Package|Core \\(Tctl|CPU'}|" +
      "Sort-Object Value -Descending|Select-Object -First 1;if($s){[int]$s.Value}";
    const o = await run('powershell.exe', [...PS, script], 3000);
    if (!o) return null;
    const n = parseInt(o.trim(), 10);
    return isNaN(n) ? null : n;
  }

  async getCpuLoadPct(): Promise<number | null> {
    const script =
      "(Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor|" +
      "?{$_.Name -eq '_Total'}).PercentProcessorTime";
    const o = await run('powershell.exe', [...PS, script], 3000);
    if (!o) return null;
    const n = parseInt(o.trim(), 10);
    return isNaN(n) ? null : n;
  }
}
