// Adaptadores por OS. Cada metodo devuelve null si el dato no esta disponible
// (herramienta ausente, sin permiso, etc.) -> el daemon omite ese campo del POST
// y el firmware conserva el ultimo valor / cae al optimista.
export interface AudioProvider {
  getVolume(): Promise<number | null>;     // 0..100 volumen de salida del sistema
  getMicMuted(): Promise<boolean | null>;  // true = mic muteado
  // Mute GLOBAL del mic a nivel OS (lo pide el pad por comando). Togglea y
  // devuelve el nuevo estado (true=muteado), o null si no se pudo.
  toggleMicMute(): Promise<boolean | null>;
}

export interface SensorProvider {
  getCpuTempC(): Promise<number | null>;
  getGpuTempC(): Promise<number | null>;
  getGpuLoadPct(): Promise<number | null>;
  getCpuFanRpm(): Promise<number | null>;  // cooler de CPU/gabinete (best-effort)
  getGpuFanPct(): Promise<number | null>;  // cooler de GPU 0..100 (nvidia-smi)
  getGpuMemMb(): Promise<{ used: number; total: number } | null>;  // VRAM (nvidia-smi)
}

// Throughput de red en bytes/s (down/up). null si no se pudo leer.
export interface NetProvider {
  getThroughput(): Promise<{ down: number; up: number } | null>;
}

// Uso del volumen principal (0..100) y throughput de disco en bytes/s (lectura/
// escritura). null si no se pudo leer.
export interface DiskProvider {
  getUsagePct(): Promise<number | null>;
  getIo(): Promise<{ rd: number; wr: number } | null>;
}

export interface PlatformProviders {
  audio: AudioProvider;
  sensors: SensorProvider;
  net: NetProvider;
  disk: DiskProvider;
}
