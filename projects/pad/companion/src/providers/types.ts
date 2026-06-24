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
  getCpuLoadPct(): Promise<number | null>; // best-effort
  getGpuLoadPct(): Promise<number | null>;
}

export interface PlatformProviders {
  audio: AudioProvider;
  sensors: SensorProvider;
}
