import type { AudioProvider } from '../types';
import { run } from '../index';

// Windows: volumen + mic mute via Core Audio (COM) con C# inline (Add-Type).
// Sin dependencias externas. BEST-EFFORT: verificar en Windows real; si algo
// falla devuelve null y el pad cae al estado optimista (sin romper nada).
const CS = `
using System;
using System.Runtime.InteropServices;
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumerator { }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int NotImpl1(); int GetDefaultAudioEndpoint(int d, int r, out IMMDevice e); }
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref Guid id, int c, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o); }
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAEV {
  int f1(IntPtr p); int f2(IntPtr p); int f3(out uint c);
  int f4(float l, ref Guid g); int SetScalar(float l, ref Guid g);
  int f6(out float l); int GetScalar(out float l);
  int f8(uint n, float l, ref Guid g); int f9(uint n, float l, ref Guid g);
  int f10(uint n, out float l); int f11(uint n, out float l);
  int SetMute(bool m, ref Guid g); int GetMute(out bool m);
}
public class PadVol {
  public static string Get() {
    var en=(IMMDeviceEnumerator)(new MMDeviceEnumerator());
    Guid iid=typeof(IAEV).GUID; int vol=-1, mic=-1;
    try { IMMDevice r; en.GetDefaultAudioEndpoint(0,0,out r); object o; r.Activate(ref iid,1,IntPtr.Zero,out o);
          float l; ((IAEV)o).GetScalar(out l); vol=(int)Math.Round(l*100); } catch {}
    try { IMMDevice c; en.GetDefaultAudioEndpoint(1,0,out c); object o; c.Activate(ref iid,1,IntPtr.Zero,out o);
          bool m; ((IAEV)o).GetMute(out m); mic=m?1:0; } catch {}
    return vol+";"+mic;
  }
  // Togglea el mute del mic de captura por defecto. Lee el estado actual de
  // eConsole y aplica el OPUESTO a eConsole(0) y eCommunications(2) -> mute
  // uniforme aunque ambos roles apunten a devices distintos. Devuelve 1/0.
  public static string ToggleMic() {
    var en=(IMMDeviceEnumerator)(new MMDeviceEnumerator());
    Guid iid=typeof(IAEV).GUID; Guid ev=Guid.Empty; bool cur=false;
    try { IMMDevice c; en.GetDefaultAudioEndpoint(1,0,out c); object o; c.Activate(ref iid,1,IntPtr.Zero,out o);
          ((IAEV)o).GetMute(out cur); } catch {}
    bool nw=!cur;
    foreach (int role in new int[]{0,2}) {
      try { IMMDevice c; en.GetDefaultAudioEndpoint(1,role,out c); object o; c.Activate(ref iid,1,IntPtr.Zero,out o);
            ((IAEV)o).SetMute(nw, ref ev); } catch {}
    }
    return nw?"1":"0";
  }
}
`;

export class WindowsAudio implements AudioProvider {
  private cache: { vol: number | null; mic: boolean | null; at: number } = { vol: null, mic: null, at: 0 };

  // Add-Type recompila por proceso PS (lento); una sola llamada trae vol+mic y
  // se cachea ~800ms para que getVolume()+getMicMuted() del mismo tick no la dupliquen.
  private async query(): Promise<void> {
    const now = Date.now();
    if (now - this.cache.at < 800) return;
    this.cache.at = now;
    const script = `Add-Type -TypeDefinition @"\n${CS}\n"@; [PadVol]::Get()`;
    const o = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], 5000);
    if (!o) { this.cache.vol = null; this.cache.mic = null; return; }
    const [v, m] = o.trim().split(';').map((x) => parseInt(x, 10));
    this.cache.vol = isNaN(v) || v < 0 ? null : Math.min(100, v);
    this.cache.mic = isNaN(m) || m < 0 ? null : m === 1;
  }

  async getVolume(): Promise<number | null> { await this.query(); return this.cache.vol; }
  async getMicMuted(): Promise<boolean | null> { await this.query(); return this.cache.mic; }

  async toggleMicMute(): Promise<boolean | null> {
    const script = `Add-Type -TypeDefinition @"\n${CS}\n"@; [PadVol]::ToggleMic()`;
    const o = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], 5000);
    this.cache.at = 0;                              // invalida el cache -> el proximo query relee el estado real
    if (!o) return null;
    const m = parseInt(o.trim(), 10);
    if (isNaN(m)) return null;
    const muted = m === 1;
    this.cache.mic = muted;
    return muted;
  }
}
